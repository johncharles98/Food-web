


function decrement(events){
    // valuecount = document.getElementById("root").value
    // if(valuecount > 0)
    //     valuecount--
    //     document.getElementById("root").value = valuecount       
    console.log(events.target.parentElement.children[1])
    let input = events.target.parentElement.children[1]
    let value = input.value
    if(value > 0)
    {
      let newvalue = value - 1
      input.value = newvalue
       console.log(input.value)
    } 
}

function increment(events){
    console.log(events.target.parentElement.children[1])
    let input = events.target.parentElement.children[1]
    let value = input.value
    let newvalue = parseInt(value) + 1
    input.value = newvalue
    console.log(input.value) 
}
