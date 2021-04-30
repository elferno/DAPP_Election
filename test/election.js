const Election = artifacts.require("Election")

contract("Election", async accounts => {

	let app;
	
	before(async() => {
		app = await Election.deployed()

		app.AddCandidate('000')
		app.AddCandidate('111')
		app.AddCandidate('222')
	})

	it("we have 3 candidates", async () => {
		const amount = await app.GetCandidatesAmount()

		assert.equal(amount, 3, "correct amount of candidates")
	})

	it("candidates are correct", async () => {
		const condidate = await app.candidates(0)

		assert.equal(condidate[0], 0		, "contains correct ID")
		assert.equal(condidate[1], "000", "contains correct Name")
		assert.equal(condidate[2], 0		, "contains correct Votes")
	})

	it("election started", async () => {
		await app.StartElection()
		const stage = await app.stage()
		assert.equal(stage.toNumber(), 1, "election started")
	})

	it("voting wirking", async () => {
		await app.vote(0)
		const condidate = await app.candidates(0)

		assert.equal(condidate[2], 1, "has 1 vote")
	})
})