const Shotter = {
	data: ()=>({
		playstate: {
			position: 0,
			paused: true,
			issuedAt: Date.now()
		},
		playersText: ["Player 1", "Player 2"].join("\n"),
		characters: ["Harry","Ron","Hermione"],
		overflow: "Hogwarts Students",
		file: "",
		lines: [],
		now: Date.now(),
		lastMessageReceived: Date.now()
	}),
	timeout: 5000,
	watch: {
		file: function(){
			axios.get(this.file)
			.then(({data})=>{
				if(data){
					if(data.lines) this.lines=data.lines
				}
			})
			.catch(console.error)
		},
		socketAge: function(){
			if(this.socketAge > this.$options.timeout){
				console.log(`Reconnecting stale socket, ${this.socketAge/1000} seconds since last message`)
				// appears the socket has died?
				
				// reset the timeout
				this.playstate.issuedAt = Date.now()
				
				if(this.socket) this.socket.close()
				this.connectSocket()
			}
		}
	},
	created: function(){
		this.connectSocket()
		
		//unpack the query string
		const queryOptionsTypes = {
			players: {isList:true},
			characters: {isList:true},
			server: {isList:false},
			room: {isList:false},
			file: {isList:false}
		};
		const queryOptions = {};
		if(window.location.search){
			let queryString = decodeURIComponent(window.location.search).substring(1)
			queryString
			.split("&")
			.forEach(pair=>{
				let [param,value] = pair.split("=")
				if(queryOptionsTypes[param]){
					if(queryOptionsTypes[param].isList) queryOptions[param] = value.split(",")
					else queryOptions[param] = value
				}
			})
		}
		//overwrite defaults

		if(queryOptions.players) this.playersText = queryOptions.players.join("\n");
		if(queryOptions.characters) this.characters = queryOptions.characters;
		if(queryOptions.overflow) this.overflow = queryOptions.overflow
		if(queryOptions.file) this.file = queryOptions.file
		else this.file = "lines/goblet.json"

		setInterval(()=>{
         		this.now = Date.now()
		}, 1000)
        
		//Notification && Notification.requestPermission()

	},
	methods: {
		drink(event){
			try{
				this.socket.send(event);
			} catch(e){
				console.error(e)
			}
		},
		connectSocket(){
			this.socket = new WebSocket(config.socketString)
			this.socket.addEventListener("message",this.eventHandler)
		},
		eventHandler(event){
			if(event.data){
				try{
					let json = JSON.parse(event.data)
					json.position = json.position || 0
					json.position *= 1000 //expect milliseconds
					this.playstate = json
					
					this.lastMessageReceived = Date.now()
					
				} catch (e) {
					console.error(`Dropped: ${JSON.stringify(event.data)}`)
				}
			}
		},
		lineIsRelevant(line = this.currentLine){
			//Relevant if switch or a character is mapped
			if(line.isSwitch) return true
			let charactersInPlay = this.playerMap(line).map(entry=>entry.character)
			return Object.keys(line.tokens).some(token=>charactersInPlay.includes(token))
		},
		characterForPlayer(player,line = this.currentLine){
			let playerIndex = this.players.indexOf(player)
			let len = this.paddedCharacters.length
			let characterIndex = ((( playerIndex - line.switchCount ) % len) + len) % len
			return this.paddedCharacters[characterIndex]	
		},
		playerMap(line = this.currentLine){
			return this.players.map(
				(player,index)=>{
					let character = this.characterForPlayer(player,line)
					return {
						character:character,
						player:player,
						index:`${character}-${player}-${index}`
					}
				}
			);
		}
	},
	computed: {
		socketAge : function(){
			return this.now - this.lastMessageReceived
		},
		players : function(){
			return this.playersText.split(/\r?\n/)
		},
		currentLine : function(){
			let averageEpoch = line => 0.5*(line.timeEpoch.to+line.timeEpoch.from)
			let lineIndex = this.lines.findIndex(line=> averageEpoch(line) >= this.playstate.position)
			//This finds the next line, so really we need to find the previous one, and account
			//For end effects
			if (lineIndex != 0) {
				//0 is the first line
				if(lineIndex==-1) lineIndex = this.lines.length //if finished
				lineIndex--;
				return {...this.lines[lineIndex], lineIndex:lineIndex}
			}
			return {switchCount:0, lineIndex:-1} //not yet started,
		},
		paddedCharacters: function(){
			return this.players.map((player,index)=>this.characters[index]||this.overflow);
		},
		recentLines: function(){
			if(this.currentLine.lineIndex==-1) return []
			//don't generate lines for unplayed characters
			let lastFive = []
			for(let offset=linesPicked=0; linesPicked < 5; offset++){
				let candidateIndex = this.currentLine.lineIndex - offset 
				if(candidateIndex < 0) break; //don't go before the first line
				let candidate = this.lines[candidateIndex]
				if(this.lineIsRelevant(candidate)){
					lastFive.push({
						...candidate,
						playerMap:this.playerMap(candidate)
					})
					linesPicked++
				}
			}
			return lastFive
		},
		currentPlayerMap: function(){
			return this.playerMap()
		},
		playGraph: function(){
			let playerCounts = {}
			this.players.forEach(player=>playerCounts[player]=0)
			return this.lines.map(line=>{
				let playerMap = this.playerMap(line)
				console.log(Object.keys(line.tokens))
				return {
					epoch: line.timeEpoch,
					score: [
						... Object.keys(line.tokens).map(character=>{
							let player = playerMap.find(entry=>entry.character==character)
							console.log(player,playerCounts)
							player && playerCounts[player] && playerCounts[player]++
							return {
								player : playerCounts[player]
							}
						})
					]
				}
			})
		}
	},
	template: `
		<div class = "container">
			{{playGraph}}
			<div class = "row">
				<film-state 
					class = "col-12"
					:position = "playstate.position"
					:paused = "playstate.paused"
					:setBy = "playstate.setBy"
					:socketAge = "socketAge"
				></film-state>
			</div>
			<div class = "row">
				<div class = "col-4">
					<h6>Who's who?</h6>
					<ul class = "list-group">
						<map-entry v-for = "entry in currentPlayerMap" :entry="entry" :key="entry.index"></map-entry>
					</ul>
					<hr/>
					<h6>Player entry</h6>
					<textarea v-model="playersText"></textarea>
					<h6>Spares</h6>
					<input type = "text" v-model="overflow"/>
				</div>
				<div class = "col-8">
					<h6>Imbibe</h6>
					<recent-line v-on:drink="drink" v-for = "line in recentLines" :key = "line.lineNumber"
							:line="line"
							:position="playstate.position"
					></recent-line>
				</div>
			</div>
		</div>
	`
}

const ShotterApp = Vue.createApp(Shotter)

ShotterApp.component('film-state',{
	data: ()=>({}),
	props: ["position","paused","setBy","socketAge"],
	computed : {
		timeString(){
			let seconds = Math.floor((this.position / 1000) % 60);
			let minutes = Math.floor((this.position / 1000 / 60 ) % 60);
			let hours = Math.floor(this.position / 1000 / 60 / 60);
			return `${hours}h ${minutes}m ${seconds}s`
		}
	},
	template: `
			<h2 :class="{'text-danger':socketAge>2500}">
				{{timeString}} 
				<small class="text-muted">{{paused ? "paused " : ""}}</small>
				<div style="font-size:12px">{{setBy}}</div>
			</h2>
		`
})

ShotterApp.component('map-entry',{
	data: ()=>({}),
	props: ["entry"],
	template: `
		<li class="list-group-item d-flex justify-content-between align-items-center">
		{{entry.player}}
			<span class="badge badge-pill" :class = "{'badge-primary': entry.character=='Harry'}">
				<i class="fas fa-bolt" v-if = "entry.character=='Harry'"></i>
				{{entry.character}}
			</span>
		</li>
		`
})


ShotterApp.component('recent-line', {
	data: () => ({}),
	props: ["line","postision"],
	methods: {
		playerForCharacter(character){
			let entry = this.line.playerMap.find(entry=>entry.character==character)
			if(!entry) return
			return entry.player
		}
	},
    created: function() {
		const notificationTitle = this.title;
		
		const characters = Object.keys(this.line.tokens)
		const playerList = characters
			.map(this.playerForCharacter)
			.filter(val=>val!==null)
			.join(", ") 
		
        	if(playerList || this.line.isSwitch){ 
			this.$emit('drink',JSON.stringify({
				time: this.line.timeEpoch.from,
				playerList: playerList || "Switch"
			}))
		}
	    
		const options = {
				body: [playerList, ... this.line.speech].join("\n")
		}
        	//Notification && new Notification( notificationTitle, options )
    },
  	computed: {
		isFresh(){
			return this.line.timeEpoch.to - this.position > -5000
		},
    		title(){
      			let characters = Object.keys(this.line.tokens)
      			return characters.length === 1 ? characters[0] : "Multiple"
    		},
		inPlayTokens(){
			let characters = this.line.playerMap.map(entry=>entry.character)
			return Object.keys(this.line.tokens) //get all the mentions in the line
				.filter(key => characters.includes(key)) //do we have a player for them
				.reduce((obj, key) => { //build and obj, from keys
					obj[key] = this.line.tokens[key]; //we filtered this key, so grab the tokens for it
					return obj;}, // and go again
				{});// start empty
		},
		inPlay(){
			return Object.keys(this.inPlayTokens).length>0
		}
  	},
	template: `
		<div class="card" 
			:class="{'text-white':line.isSwitch, 'bg-dark':line.isSwitch, 'fresh': !line.isSwitch}" 
			v-if="line.isSwitch || inPlay">
	      <div class="card-body">
		<h5 class="card-title">{{ title }}</h5>
		<h6 class="card-subtitle mb-2 text-muted">
		  <span v-for = "(count, character) in inPlayTokens" :key="character" href="#" class="card-link">
			<i class="fas fa-glass-cheers"></i> <span class="badge badge-pill badge-warning" v-if="count.local>1">{{count.local}}</span> {{playerForCharacter(character)}}
		  </span>
		</h6>
		<div class="card-text" v-for="(partial,index) in line.speech" :key="index">
		    {{partial}}
		</div>
		<div class="card-text" v-if="line.isSwitch">
		  <h6><i class="fas fa-redo"></i> Switch</h6>
		  <span v-for = "entry in line.playerMap" :key="entry.player">
		    {{entry.player}} <small>drink for</small> {{entry.character}}<br>
		  </span>
		</div>
	      </div>
	    </div>
	`
})

ShotterApp.mount('#shotter')
