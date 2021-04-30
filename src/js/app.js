App =
{
	// var
	web3					: null,
	web3Provider	: null,
	contracts			: {},
	hasVoted			: false,
	account				: '0x0',


	// scope PREPARE
	init: async function()
	{
		this.initWeb3()						// create web3, get its provider
		await this.initContract()	// create contract instance
		this.render()							// render page
	},

	initWeb3: async function ()
	{
		if (typeof web3 !== 'undefined')	// If a web3 instance is already provided by Meta Mask.
			this.web3Provider = window.ethereum
		else 															// Specify default instance if no web3 instance provided
			this.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545')

		this.web3 = new Web3(this.web3Provider)
	},

	initContract: async function()
	{
		// reqire .json structure of the contract
		const election = await this.getJSON('Election.json')

		// Instantiate a new truffle contract from the artifact
		this.contracts.Election = TruffleContract(election)

		// Connect provider to interact with contract
		this.contracts.Election.setProvider(this.web3Provider)

		// begin listening to events
		this.listenForEvents()
	},

	// Listen for events emitted from the contract
	listenForEvents: async function()
	{
		// var
		const contract = await this.contracts.Election.deployed()
		const event 	 = await contract.Voted()

		// listen to event
		event.on('data', result => {
			const { args: {voter, candidate} } = result

			console.log('VOTER : ', voter)
			console.log('CANDIDATE : ', candidate)

			this.render()
		})
	},


	// scope RENDER PAGE
	render: async function()
	{
		// var
		const loader  = this.id('#loader')
		const content = this.id('#content')
		const candidatesResults = this.id('#candidatesResults')
		const candidatesSelect  = this.id('#candidatesSelect')


		//
		loader.show()
		content.hide()


		// Load account data
		//this.web3.eth.requestAccounts()
		const [account] = await this.web3.eth.getAccounts()
		this.account = account

		this.id('#accountAddress').html(`Your Account : <b>${ this.account }</b>`)


		// Load contract data
		const contract				 = await this.contracts.Election.deployed()
		const candidatesCount  = await contract.GetCandidatesAmount()
		const hasVoted 				 = await contract.voters(this.account)


		// Fill in page
		candidatesResults.empty();
		candidatesSelect.empty();

		for (let i = 0; i < candidatesCount.toNumber(); i++)
		{
			// local var
			const candidate = await contract.candidates(i)
			const id 				= candidate[0]
			const name 			= candidate[1]
			const voteCount = candidate[2]
			const cTemplate = `<tr><th>${ id }</th><td>${ name }</td><td>${ voteCount }</td></tr>`
			const cOption 	= `<option value='${ id }' >${ name }</option>`

			// Render candidate Result
			candidatesResults.append(cTemplate)

			// Render candidate ballot option
			candidatesSelect.append(cOption)
		}


		//
		if( hasVoted )
			this.id('form').hide()

		loader.hide()
		content.show()
	},

	// scope VOTING
	castVote: async function() {
		// var
		const candidateId = this.id('#candidatesSelect').val()
		const contract 		= await this.contracts.Election.deployed()

		// vote
		contract.vote(candidateId, { from: this.account })

		// Wait for votes to update
		this.id('#content').hide()
		this.id('#loader').show()
	},


	// system functions
	handle: promise =>
	{
		return promise
			.then(data => [data, null])
			.catch(err => [null,  err])
	},

	getJSON: async function (url)
	{
		let response = await fetch(url)
		let data = await response.json()
		return data
	},

	id: function (selector)
	{
		const elem = document.querySelectorAll(selector)

		for (let i = 0; i < elem.length; i++)
		{
			const el = elem[i]

			el.style 	= (style) => { if ( style ) el.setAttribute('style', style)
															 else el.removeAttribute('style') }
			el.html 	= (html) 	=> { el.innerHTML = html }
			el.hide 	= () 			=> { el.style.display = 'none' }
			el.show 	= () 			=> { el.style.display = '' }
			el.val 		= (val)		=> { return el.value }
			el.empty	= ()			=> { while (el.firstChild) el.removeChild(el.firstChild) }
			el.append	= (html)	=> { el.insertAdjacentHTML('beforeend', html); }
		}

		return elem.length === 1 ? elem[0] : elem;
	}
}

document.addEventListener("DOMContentLoaded", function () { App.init() })