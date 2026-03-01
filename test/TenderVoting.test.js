const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TenderVoting", function () {
    let tenderVoting;
    let owner, org1, voter1, voter2, voter3, nonWhitelisted;

    beforeEach(async function () {
        [owner, org1, voter1, voter2, voter3, nonWhitelisted] = await ethers.getSigners();

        const TenderVoting = await ethers.getContractFactory("TenderVoting");
        tenderVoting = await TenderVoting.deploy();
        await tenderVoting.waitForDeployment();
    });

    describe("Tender Creation", function () {
        it("Should create a public tender", async function () {
            const tx = await tenderVoting.connect(org1).createTender(
                "Build Road",
                "Construction of highway",
                "Infrastructure",
                ethers.parseEther("100"),
                7, // 7 days
                false, // public
                []
            );

            await expect(tx)
                .to.emit(tenderVoting, "TenderCreated")
                .withArgs(0, org1.address, "Build Road", false, await time.latest() + 7 * 24 * 60 * 60);

            const tender = await tenderVoting.getTenderDetails(0);
            expect(tender.title).to.equal("Build Road");
            expect(tender.organization).to.equal(org1.address);
            expect(tender.isRestricted).to.equal(false);
        });

        it("Should create a restricted tender with whitelist", async function () {
            await tenderVoting.connect(org1).createTender(
                "Private Project",
                "Restricted voting",
                "Healthcare",
                ethers.parseEther("50"),
                5,
                true, // restricted
                [voter1.address, voter2.address]
            );

            expect(await tenderVoting.isWhitelisted(0, voter1.address)).to.equal(true);
            expect(await tenderVoting.isWhitelisted(0, voter2.address)).to.equal(true);
            expect(await tenderVoting.isWhitelisted(0, voter3.address)).to.equal(false);
        });

        it("Should reject tender with empty title", async function () {
            await expect(
                tenderVoting.createTender("", "Description", "Category", 1000, 7, false, [])
            ).to.be.revertedWith("Title cannot be empty");
        });

        it("Should reject tender with zero duration", async function () {
            await expect(
                tenderVoting.createTender("Title", "Description", "Category", 1000, 0, false, [])
            ).to.be.revertedWith("Duration must be positive");
        });

        it("Should reject restricted tender with empty whitelist", async function () {
            await expect(
                tenderVoting.createTender("Title", "Description", "Category", 1000, 7, true, [])
            ).to.be.revertedWith("Whitelist cannot be empty for restricted tenders");
        });
    });

    describe("Voting", function () {
        beforeEach(async function () {
            // Create a public tender
            await tenderVoting.connect(org1).createTender(
                "Public Tender",
                "Anyone can vote",
                "Education",
                ethers.parseEther("25"),
                7,
                false,
                []
            );
        });

        it("Should allow voting on public tender", async function () {
            await expect(tenderVoting.connect(voter1).vote(0, true))
                .to.emit(tenderVoting, "VoteCast")
                .withArgs(0, voter1.address, true);

            const tender = await tenderVoting.getTenderDetails(0);
            expect(tender.votesFor).to.equal(1);
            expect(tender.votesAgainst).to.equal(0);
        });

        it("Should track votes correctly", async function () {
            await tenderVoting.connect(voter1).vote(0, true);
            await tenderVoting.connect(voter2).vote(0, true);
            await tenderVoting.connect(voter3).vote(0, false);

            const tender = await tenderVoting.getTenderDetails(0);
            expect(tender.votesFor).to.equal(2);
            expect(tender.votesAgainst).to.equal(1);
        });

        it("Should prevent double voting", async function () {
            await tenderVoting.connect(voter1).vote(0, true);
            await expect(tenderVoting.connect(voter1).vote(0, false)).to.be.revertedWith(
                "Already voted"
            );
        });

        it("Should prevent voting after deadline", async function () {
            // Fast forward time by 8 days
            await time.increase(8 * 24 * 60 * 60);

            await expect(tenderVoting.connect(voter1).vote(0, true)).to.be.revertedWith(
                "Voting period ended"
            );
        });

        it("Should prevent voting on closed tender", async function () {
            await time.increase(8 * 24 * 60 * 60);
            await tenderVoting.closeTender(0);

            await expect(tenderVoting.connect(voter1).vote(0, true)).to.be.revertedWith(
                "Tender is closed"
            );
        });
    });

    describe("Restricted Voting", function () {
        beforeEach(async function () {
            // Create a restricted tender
            await tenderVoting.connect(org1).createTender(
                "Restricted Tender",
                "Only whitelisted can vote",
                "Infrastructure",
                ethers.parseEther("100"),
                7,
                true,
                [voter1.address, voter2.address]
            );
        });

        it("Should allow whitelisted voter to vote", async function () {
            await expect(tenderVoting.connect(voter1).vote(0, true)).to.not.be.reverted;
        });

        it("Should reject non-whitelisted voter", async function () {
            await expect(tenderVoting.connect(nonWhitelisted).vote(0, true)).to.be.revertedWith(
                "Not authorized to vote"
            );
        });

        it("Should allow organization to add voters to whitelist", async function () {
            await tenderVoting.connect(org1).addToWhitelist(0, [voter3.address]);
            expect(await tenderVoting.isWhitelisted(0, voter3.address)).to.equal(true);
            await expect(tenderVoting.connect(voter3).vote(0, true)).to.not.be.reverted;
        });

        it("Should reject non-organization from modifying whitelist", async function () {
            await expect(
                tenderVoting.connect(voter1).addToWhitelist(0, [voter3.address])
            ).to.be.revertedWith("Only organization can modify whitelist");
        });
    });

    describe("Tender Closing", function () {
        beforeEach(async function () {
            await tenderVoting.connect(org1).createTender(
                "Test Tender",
                "Description",
                "Category",
                ethers.parseEther("50"),
                7,
                false,
                []
            );

            await tenderVoting.connect(voter1).vote(0, true);
            await tenderVoting.connect(voter2).vote(0, true);
            await tenderVoting.connect(voter3).vote(0, false);
        });

        it("Should close tender after deadline", async function () {
            await time.increase(8 * 24 * 60 * 60);

            await expect(tenderVoting.closeTender(0))
                .to.emit(tenderVoting, "TenderClosed")
                .withArgs(0, 2, 1, true);

            const tender = await tenderVoting.getTenderDetails(0);
            expect(tender.isClosed).to.equal(true);
        });

        it("Should reject closing before deadline", async function () {
            await expect(tenderVoting.closeTender(0)).to.be.revertedWith("Deadline not reached");
        });

        it("Should reject closing already closed tender", async function () {
            await time.increase(8 * 24 * 60 * 60);
            await tenderVoting.closeTender(0);

            await expect(tenderVoting.closeTender(0)).to.be.revertedWith("Already closed");
        });
    });

    describe("Helper Functions", function () {
        beforeEach(async function () {
            await tenderVoting.connect(org1).createTender(
                "Tender 1",
                "Active",
                "Category",
                1000,
                7,
                false,
                []
            );
            await tenderVoting.connect(org1).createTender(
                "Tender 2",
                "Active",
                "Category",
                2000,
                7,
                false,
                []
            );
        });

        it("Should return active tenders", async function () {
            const activeTenders = await tenderVoting.getActiveTenders();
            expect(activeTenders.length).to.equal(2);
        });

        it("Should check if voter can vote", async function () {
            expect(await tenderVoting.canVote(0, voter1.address)).to.equal(true);

            await tenderVoting.connect(voter1).vote(0, true);
            expect(await tenderVoting.canVote(0, voter1.address)).to.equal(false);
        });

        it("Should get organization tenders", async function () {
            const orgTenders = await tenderVoting.getOrganizationTenders(org1.address);
            expect(orgTenders.length).to.equal(2);
        });

        it("Should get voter history", async function () {
            await tenderVoting.connect(voter1).vote(0, true);
            await tenderVoting.connect(voter1).vote(1, false);

            const history = await tenderVoting.getVoterHistory(voter1.address);
            expect(history.length).to.equal(2);
        });

        it("Should calculate vote results correctly", async function () {
            await tenderVoting.connect(voter1).vote(0, true);
            await tenderVoting.connect(voter2).vote(0, true);
            await tenderVoting.connect(voter3).vote(0, false);

            const results = await tenderVoting.getVoteResults(0);
            expect(results.votesFor).to.equal(2);
            expect(results.votesAgainst).to.equal(1);
            expect(results.totalVotes).to.equal(3);
            expect(results.supportPercentage).to.equal(66); // 2/3 * 100
            expect(results.isApproved).to.equal(true);
        });
    });
});
