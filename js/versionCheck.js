const checkVersion = () => {
   axios.request({
      method: "get",
      baseUrl: location.href,
      url: "version"
   })
  .then(({data})=>{
    console.log(data)
    if(data.trim() != revision) location.reload();
  })
  .catch(error=>console.error)
}

//setInterval(checkVersion,1000)
