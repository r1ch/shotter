const Shotter = {
	data: ()=>({
		epoch: 0,
		playersText: ["Player 1", "Player 2"].join("\n")
	}),
	created: function(){
		//unpack the query string
		const queryOptionsTypes = {
			players: {isList:true},
			server: {isList:false},
			room: {isList:false}
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
		this.connectSocket()
	},
	methods: {
		connectSocket(){
			this.socket = new WebSocket("wss://sockets.bradi.sh:8443")
			this.socket.addEventListener("message",this.eventHandler)
		},
		eventHandler(event){
			if(event.data){
				let json = {}
				try{
					json = JSON.parse(event.data)
				} catch (e) {
					console.error(`I hate this ${JSON.stringify(event)}`)
				}
				if(json.position){
					this.epoch = json.position * 1000;
				}
			}
		},
		characterForPlayer(player,line = this.currentLine){
			let playerIndex = this.players.indexOf(player)
			let len = this.paddedCharacters.length
			let characterIndex = ((( playerIndex - line.switchCount ) % len) + len) % len
			return this.paddedCharacters[characterIndex]	
		},
		playerMap(line = this.currentLine){
			return this.players.map(player=>({character:this.characterForPlayer(player,line),player:player}));
		}
	},
	computed: {
		players : function(){
			return this.playersText.split(/\r?\n/)
		},
		currentLine : function(){
			let lineIndex = this.$options.keyLines.findIndex(line=>line.timeEpoch.from >= this.epoch)
			//This finds the next line, so really we need to find the previous one, and account
			//For end effects
			if (lineIndex != 0) {
				//0 is the first line
				if(lineIndex==-1) lineIndex = this.$options.keyLines.length //if finished
				lineIndex--;
				return {...this.$options.keyLines[lineIndex], lineIndex:lineIndex}
			}
			return {switchCount:0, lineIndex:-1} //not yet started,
		},
		paddedCharacters: function(){
			return this.players.map((player,index)=>this.$options.characters[index]||"Hogwarts Students");
		},
		recentLines: function(){
			if(this.currentLine.lineIndex==-1) return []
			let lastFive = this.$options.keyLines.slice(Math.max(0,this.currentLine.lineIndex-5),this.currentLine.lineIndex+1)
			return lastFive.reverse()
				.map(line=>({
					...line,
					playerMap:this.playerMap(line)
				}))	
		},
		currentPlayerMap: function(){
			return this.playerMap()
		}
	},
	keyLines: lines.key,
	allLines: lines.all,
	characters: ["Harry", "Ron", "Hermione"],
	template: `
		<div class = "container">
			<div class = "row">
				<film-state 
					class = "col-12"
					:epoch="epoch"
				></film-state>
			</div>
			<div class = "row">
				<div class = "col-3">
					<h6>Who's who?</h6>
					<ul class = "list-group" >
						<map-entry v-for = "entry in currentPlayerMap" :key = "entry.player"
							:entry="entry"
						></map-entry>
					</ul>
					<hr/>
					<h6>Player entry</h6>
					<textarea v-model="playersText"></textarea>
				</div>
				<div class = "col-9">
					<h6>Imbibe</h6>
					<recent-line v-for = "line in recentLines" :key = "line.lineNumber"
							:line="line"
					></recent-line>
				</div>
			</div>
		</div>
	`
}

const ShotterApp = Vue.createApp(Shotter)

ShotterApp.component('film-state',{
	data: ()=>({}),
	props: ["epoch"],
	computed : {
		timeString(){
			let seconds = Math.floor((this.epoch / 1000) % 60);
			let minutes = Math.floor((this.epoch / 1000 / 60 ) % 60);
			let hours = Math.floor(this.epoch / 1000 / 60 / 60);
			return `${hours}h ${minutes}m ${seconds}s`
		}
	},
	template: `<h2>{{timeString}}</h2>`
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
	props: ["line"],
	methods: {
		playerForCharacter(character){
			let entry = this.line.playerMap.find(entry=>entry.character==character)
			if(!entry) return
			return entry.player
		}
	},
  	computed: {
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
	    <div class="card" :class="{'text-white':line.isSwitch, 'bg-dark':line.isSwitch}" v-if="isSwitch || inPlay">
	      <div class="card-body">
		<h5 class="card-title">{{ title }}</h5>
		<h6 class="card-subtitle mb-2 text-muted">
		  <span v-for = "(count, character) in inPlayTokens" :key="character" href="#" class="card-link">
			<div class = "fa-2x">
				<span class="fa-layers fa-fw">
					<i class="fas fa-glass-cheers"></i>
					<span class="fa-layers-counter" style="background:Tomato">{{count.local}}</span>
				</span>
			</div>
			{{playerForCharacter(character)}}
		  </span>
		</h6>
		<p class="card-text" >
		    {{ line.speech.join("&nbsp;") }}
		</p>
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
