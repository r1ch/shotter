const Shotter = {
	data: ()=>({
		
	}),
	computed: {
		recentLines: function(){
			let oldest = this.$options.keyLines.findIndex(line=>line.timeEpoch.from>=this.epoch)
			console.log(oldest)
			return this.$options.keyLines.slice(Math.max(0,oldest-5),oldest).reverse()
		} 

	},
	keyLines: lines.key,
	allLines: lines.all,
	players : ["Alex", "Clare", "Nick", "Megan", "Rich", "Soph"],
	characters: ["Harry", "Ron", "Hermione"],
	template: `
		<div>
			<film-state></film-state>
			<player-state></player-state>
			<recent-lines v:for="line in recentLines" :key = "line.lineNumber" :recentLines="recentLines"></recent-lines>
		</div>
	`
}

const ShotterApp = Vue.createApp(Shotter)

ShotterApp.component('film-state',{
	data: ()=>({}),
	template: `<div>It's a film</div>`
})

ShotterApp.component('player-state',{
	data: ()=>({}),
	template: `<div>Players be playing</div>`
})


ShotterApp.component('recent-lines', {
	data: () => ({}),
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
