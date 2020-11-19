const Shotter = {
	data: ()=>({
		epoch: 0,
		playersText: ["Player 1", "Player 2"].join("\n")
	}),
	created: function(){
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
			let characterIndex =  (playerIndex - line.voldeCount + this.paddedCharacters.length) % this.paddedCharacters.length
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
			let lineIndex = this.$options.keyLines.findIndex(line=>line.timeEpoch.from >= this.epoch)-1;
			if (lineIndex !== -1) return {...this.$options.keyLines[lineIndex], lineIndex:lineIndex}
			return {voldeCount:0, lineIndex:lineIndex}
		},
		paddedCharacters: function(){
			return this.players.map((player,index)=>this.$options.characters[index]||"Hogwarts Student");
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
		
		//Want to "bake" each line - so we do the heavy lifting here, not pass it down to the line render
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
					<ul class = "list-group" >
						<map-entry v-for = "entry in currentPlayerMap" :key = "entry.player"
							:entry="entry"
						></map-entry>
					</ul>
					<textarea v-model="playersText"></textarea>
					*{{players}}*
				</div>
				<div class = "col-9">
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
		characterTokens(){
			let tokens = Object.assign({},this.line.tokens)
			delete tokens.Voldemort
			return tokens
		}
  	},
	template: `
	    <div class="card" :class="{'text-white':line.tokens.Voldemort, 'bg-dark':line.tokens.Voldemort}">
	      <div class="card-body">
		<h5 class="card-title">{{ title }}</h5>
		<h6 class="card-subtitle mb-2 text-muted">
		  <span v-for = "(count, character) in characterTokens" :key="character" href="#" class="card-link">
			<i class="fas fa-glass-cheers"></i> {{playerForCharacter(character)}}
		  </span>
		</h6>
		<p class="card-text" >
		  <span v-for = "(text,index) in line.speech" :key="index">
		    {{ text }}
		  </span>
		</p>
		<div class="card-text" v-if="line.tokens.Voldemort">
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
