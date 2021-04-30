// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

contract Election
{
	// var
	struct Candidate
	{
		uint256 id;
		string name;
		uint256 votes;
		bool exists;
	}

	enum Stage
	{
		Setting,
		Voting
	}
	
	address private owner;

	Candidate [] public candidates;
	mapping (address => bool) public voters;

	Stage public stage;
	//


	// events
	event ElectionStarted (
		uint256 indexed startDate,
		string [] candidates
	);

	event ElectionFinished (
		uint256 indexed finishDate,
		string winner,
		uint256 winRate
	);
	
	event Voted (
	    address voter,
	    string candidate
	);
	//


	// modifiers
	modifier OnlyOwner
	{
		require (owner == msg.sender, "you are not permitted to do this");
		_;
	}

	modifier OnlyVotingStage
	{
		require (stage == Stage.Voting, "can do only while VOTING phase");
		_;
	}
	modifier OnlySettingStage
	{
		require (stage == Stage.Setting, "can do only while SETTING phase");
		_;
	}
	
	modifier CandidateExists (uint256 _id)
	{
	    require (candidates[_id].exists, "candidate doesn't exist");
	    _;
	}
	//


	// construct
	constructor ()
	{
		owner = msg.sender;

		AddCandidate('Vladimir Biden');
		AddCandidate('Joe Medvedev');
		AddCandidate('Dmitriy Putin');

		StartElection();
	}
	//


	// owner scope : ADD / REMOVE candidate
	string public name;
	function AddCandidate (string memory _name)
		public
		OnlyOwner
		OnlySettingStage
	{
		Candidate memory newCandidate = Candidate(candidates.length, _name, 0, true);
		candidates.push(newCandidate);
	}

	function RemoveCandidate (uint256 _id)
		public
		OnlyOwner
		OnlySettingStage
		CandidateExists(_id)
	{
		for (uint i = _id; i < candidates.length - 1; i++)
			candidates[i] = candidates[i + 1];

		candidates.pop();
	}

	function GetCandidatesAmount()
		view
		public
		OnlyOwner
		returns (uint256 amount)
	{
		return candidates.length;
	}
	//

	// owner scope : START / FINISH elections
	function StartElection ()
		public
		OnlyOwner
		OnlySettingStage
	{
		// read and store candidates.name array
		string [] memory _candidates = new string[](candidates.length);

		for (uint256 i = 0; i < candidates.length; i++)
			_candidates[i] = candidates[i].name;

		// set stage
		stage = Stage.Voting;

		// log election started
		emit ElectionStarted (block.timestamp, _candidates);
	}

	function FinishElection ()
		public
		OnlyVotingStage
	{
		// calc winner
		string memory _winner;
		uint256 _winrate = 0;
		uint256 _totalScore = 0;
		uint256 _currentScore = 0;

		for (uint256 i = 0; i < candidates.length; i++)
		{
			_totalScore += candidates[i].votes;

			if (candidates[i].votes > _currentScore)
			{
				_currentScore = candidates[i].votes;
				_winner = candidates[i].name;
			}
		}

		_winrate = ( _currentScore / _totalScore ) * 10000;

		// drop defaults
		delete candidates;

		// set stage
		stage = Stage.Setting;

		// log stats
		emit ElectionFinished (block.timestamp, _winner, _winrate);
	}
	//


	// consumer scope
	function vote (uint256 _candidateID)
		public
		CandidateExists(_candidateID)
	{
		require (!voters[msg.sender], "you have already voted");

		voters[msg.sender] = true;
		candidates[_candidateID].votes ++;

		emit Voted (msg.sender, candidates[_candidateID].name);
	}
	//
}