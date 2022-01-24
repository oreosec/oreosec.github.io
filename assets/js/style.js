window.addEventListener("scroll", function () {
	const scrolled = window.scrollY;
	console.log(scrolled);

// sec scrolling
	const sec = document.querySelector('#sec-img');
	if (scrolled >= 450){
		if (sec.classList.contains("hidden-right")) {
			sec.classList.remove("hidden-right");
		}
	}
	else{
		if (!sec.classList.contains("hidden-right")) {
			sec.classList.add("hidden-right");
		}
	}
//end sec scroll
//ctf scrolling
	const ctf = document.querySelector('#ctf-img');
	if (scrolled >= 790){
		if (ctf.classList.contains("hidden-left")) {
			ctf.classList.remove("hidden-left");
		}
	}
	else{
		if (!ctf.classList.contains("hidden-left")) {
			ctf.classList.add("hidden-left");
		}
	}
//end ctf scroll
//code scrolling
	const coding = document.querySelector('#code-img');
	if (scrolled >= 1062){
		if (coding.classList.contains("hidden-right")) {
			coding.classList.remove("hidden-right");
		}
	}
	else{
		if (!coding.classList.contains("hidden-right")) {
			coding.classList.add("hidden-right");
		}
	}
//end ctf scroll


});
