const Shotter = {
	data: ()=>({
		epoch: 0
	}),
	created: function(){
		this.connectSocket()
	},
	methods: {
		connectSocket(){
			this.socket = new WebSocket("ws://18.133.229.150:8080")
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
		}
	},
	computed: {
		recentLines: function(){
			let oldest = this.$options.keyLines.findIndex(line=>line.timeEpoch.from>=this.epoch)
			console.log(oldest)
			return this.$options.keyLines.slice(Math.max(0,oldest-5),oldest).reverse()
		} 
		//Want to "bake" each line - so we do the heavy lifting here, not pass it down to the line render
		//Need player->Character and Character->player here
	},
	keyLines: lines.key,
	allLines: lines.all,
	players : ["Colemen", "Bradii", "Forins", "Marrison"],
	characters: ["Harry", "Ron", "Hermione"],
	template: `
		<div>
			<film-state
				:epoch="epoch"
			></film-state>
			<player-state></player-state>
			<div v-for = "line in recentLines">
				<recent-line
					:characters="$options.characters"
					:players="$options.players"
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

ShotterApp.component('player-state',{
	data: ()=>({}),
	template: `<div>Players be playing</div>`
})


ShotterApp.component('recent-line', {
	data: () => ({}),
	props: ["line","characters","players"],
	methods: {
		playerFromCharacter: function(character) {
			let characterIndex = this.characters.indexOf(character)
			if(characterIndex == -1) {return}
			else return this.players[(characterIndex + this.line.voldeCount)%this.players.length]
		},
		characterFromPlayer: function(player){
			let playerIndex = this.players.indexOf(player)
			let inclusive = [...this.characters]
			while(inclusive.length<this.players.length) inclusive.push("Hogwarts' Students")
				let characterIndex =  (playerIndex - this.line.voldeCount + inclusive.length) % inclusive.length
			return inclusive[characterIndex]
		}
  	},
  	computed: {
    		title(){
      			let characters = Object.keys(this.line.tokens)
      			return characters.length === 1 ? characters[0] : "Multiple"
    		}
  	},
	template: `
	    <div class="card" style="width: 25rem;">
	      <div class="card-body">
		<h5 class="card-title">{{ title }}</h5>
		<h6 class="card-subtitle mb-2 text-muted">
		  <span v-for = "(count, character) in line.tokens" :key="character" href="#" class="card-link">
		    {{ playerFromCharacter(character) }}
		  </span>
		</h6>
		<p class="card-text" >
		  <span v-for = "(text,index) in line.speech" :key="index">
		    {{ text }}
		  </span>
		</p>
		<div class="card-text" v-if="line.tokens.Voldemort">
		  <h6>Switch</h6>
		  <span v-for = "player in players" :key="player">
		    {{player}} : {{characterFromPlayer(player)}}<br>
		  </span>
		</div>
		<div class="card-text" v-if="!line.tokens.Voldemort">
		  <small v-for = "player in players" :key="player">
		  {{player}}:{{characterFromPlayer(player)}}
		  </small>
		</div>
	      </div>
	    </div>
	`
})

ShotterApp.mount('#shotter')
