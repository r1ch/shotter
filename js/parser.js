const Parser = {
	data: ()=>({
		raw = "";
	}),
	mounted:{
		axios.get("subs/Goblet.srt")
		.then(({data})=>{
			this.raw = data;
		})
		.catch(console.error)
	},
	computed: {
		processedLines(){
			const searches = [
			    {match: "Ron",                          name: "Ron",           certain: true,  switch: false},
			    {match: "(?<!(Ron |Ronald ))Weasley",   name: "Ron",           certain: false, switch: false},
			    {match: "Harry",                        name: "Harry",         certain: true,  switch: false},
			    {match: "(?<!Harry )Potter",            name: "Harry",         certain: false, switch: false},
			    {match: "Hermione",                     name: "Hermione",      certain: true,  switch: false},
			    {match: "(?<!Hermione )Grainger",       name: "Hermione",      certain: true,  switch: false},
			    {match: "Dumbledore",                   name: "Dumbledore",    certain: true,  switch: false},
			    {match: "Voldemort",                    name: "Voldemort",     certain: true,  switch: true}
			]
			const tokens = searches.map(search=>({
			    name: search.name,
			    matcher: new RegExp(`${search.match}`,'g'),
			    certain: search.certain,
			    switch: search.switch,
			}))
			
			let lineCounter = 1
			let mode = 0 // 0 : lineNumber, 1: timecode, 2: speech(multiple), ended by a blank line (then 0)
			let lines = this.raw.split(/\r?\n/)
			let out = []
			let outLine = {}
			let counts = {
			    switchCount:0,
			    global:{},
			    local:{}
			}

			lines.forEach(line=>{
				if(mode == 0 && line == lineCounter){
					mode = 1; //Expect a timeCode next
					
					outLine.lineNumber = lineCounter
					lineCounter++;
				} else if (mode == 1){
					mode = 2; //Expect some speech next

					let [from, to] = line.split(" --> ")

					let [fromH, fromM, fromSMS] = from.split(":")
					let [fromS, fromMS] = fromSMS.split(",")

					let [toH, toM, toSMS] = to.split(":")
					let [toS, toMS] = toSMS.split(",")

					let fromTime = parseInt(fromMS) + parseInt(fromS)*1000 + parseInt(fromM)*60*1000 + parseInt(fromH)*60*60*1000
					let toTime = parseInt(toMS) + parseInt(toS)*1000 + parseInt(toM)*60*1000 + parseInt(toH)*60*60*1000

					outLine.timeText = line
					outLine.timeEpoch = {from:fromTime, to:toTime}

				} else if (mode == 2 && line != ""){
					//This is (still) speech
					outLine.speech = outLine.speech || []
					outLine.speech.push(line)
					tokens.forEach(token=>{
					    let match = line.match(token.matcher)
					    if(match){
						outLine.tokens = outLine.tokens || {}
						counts.local[token.name] = counts.local[token.name] || 0
						counts.local[token.name] += match.length
						counts.global[token.name] = counts.global[token.name] || 0
						counts.global[token.name] += match.length
						outLine.tokens[token.name] = {
						    global:counts.global[token.name],
						    local:counts.local[token.name]
						}
						if(token.switch){
						    outLine.isSwitch = true
						    counts.switchCount++
						}
						outLine.switchCount = counts.switchCount
					    }

					})
		    		} else if (mode == 2 && line == ""){
					//End of speech, expect another line
					mode = 0
					out.push(outLine)
					outLine = {}
					counts.local = {}
				} else {
					//Oh dear, try to find our way?
					mode = 0
					console.log(`Skipped:>${line}<`)
				}
			})
			return out
		}
	},
	template: `
		{{processedLines}}
	`
}

const ParserApp = Vue.createApp(Parser)

ParserApp.component('film-state',{
})

ParserApp.mount('#app')

