const Shotter = {
	data: ()=>({
		epoch: 0
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
			let playerIndex = this.$options.players.indexOf(player)
			let characterIndex =  (playerIndex - line.voldeCount + this.paddedCharacters.length) % this.paddedCharacters.length
			return this.paddedCharacters[characterIndex]	
		},
		playerMap(line = this.currentLine){
			return this.$options.players.map(player=>({character:this.characterForPlayer(player,line),player:player}));
		}
	},
	computed: {
		currentLine : function(){
			let line = this.$options.keyLines.find(line=>line.timeEpoch.from>=this.epoch)
			return line || {voldeCount:0};
		},
		paddedCharacters: function(){
			return this.$options.players.map((player,index)=>this.$options.characters[index]||"Hogwarts Student");
		},
		recentLines: function(){
			let mostRecentIndex = this.$options.keyLines.findIndex(line=>line.timeEpoch.from<=this.epoch)
			let lastFive =  this.$options.keyLines.slice(Math.max(0,mostRecentIndex-5),mostRecentIndex)
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
	players : ["Colemen", "Bradii", "Forins", "Marrison"],
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
				<ul class = "list-group col-3" >
					<map-entry v-for = "entry in currentPlayerMap" :key = "entry.player"
						:entry="entry"
					></map-entry>
				</ul>
				<recent-line v-for = "line in recentLines" :key = "line.lineNumber"
						class = "offset-3 col-9" 
						:line="line"
				></recent-line>
			</div>
		</div>
	`
}

const ShotterApp = Vue.createApp(Shotter)

ShotterApp.component('film-state',{
	data: ()=>({}),
	props: ["epoch"],
	template: `<div>{{epoch}}</div>`
})

ShotterApp.component('map-entry',{
	data: ()=>({}),
	props: ["entry"],
	template: `
		<li class="list-group-item">{{entry.player}} -> {{entry.character}}</li>
		`
})


ShotterApp.component('recent-line', {
	data: () => ({}),
	props: ["line"],
  	computed: {
    		title(){
      			let characters = Object.keys(this.line.tokens)
      			return characters.length === 1 ? characters[0] : "Multiple"
    		}
  	},
	template: `
	    <div class="card">
	      <div class="card-body">
		<h5 class="card-title">{{ title }}</h5>
		<h6 class="card-subtitle mb-2 text-muted">
		  <span v-for = "(count, character) in line.tokens" :key="character" href="#" class="card-link">
		    {{ line.playerMap.find(entry=>entry.character==character).player }}
		  </span>
		</h6>
		<p class="card-text" >
		  <span v-for = "(text,index) in line.speech" :key="index">
		    {{ text }}
		  </span>
		</p>
		<div class="card-text" v-if="line.tokens.Voldemort">
		  <h6>Switch</h6>
		  <span v-for = "entry in line.playerMap" :key="entry.player">
		    {{entry.player}} -> {{entry.character}}<br>
		  </span>
		</div>
	      </div>
	    </div>
	`
})

ShotterApp.mount('#shotter')
