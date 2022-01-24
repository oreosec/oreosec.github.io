var htmlasli = `
<div class="card mb-4 col-sm" style="background:#16131c" id="$id$">
	<div class="card-body">
		<strong>$title$</strong>
		<p class="card-text text-muted">
			
		</p>
		<div class="d-flex justify-content-between align-items-center">
		<div class="btn-group">
			<a href="$url$" type="button" target="_blank" class="btn btn-sm btn-outline-secondary">View</a>
		</div>
		<small class="text-muted">9 mins</small>
		</div>
	</div>
</div>`
var xmlhttp = new XMLHttpRequest();
xmlhttp.open("GET", "../content/content.txt", true);
xmlhttp.send();
xmlhttp.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
		var myArr = JSON.parse(this.responseText);
		// html = html.replace("$img$", myArr[0].img)
		// html = html.replace("$title$", myArr[0].title)
		// html = html.replace("$text$", myArr[0].spoiler)
		var arrayContent = [];
		arrayContent.push(`
		<div class="mb-4 col-sm tag card" style="background:linear-gradient(#ff8a00,#e52e71);">
			<strong class="nyamping">HackTheBox</strong>
		</div>
		`)
		for(var i=0; i<myArr.length; i++){
			html = htmlasli.replace("$img$", myArr[i].img)
			html = html.replace("$title$", myArr[i].title)
			html = html.replace("$id$", myArr[i].id)
			// html = html.replace("$text$", myArr[i].spoiler)
			html = html.replace("$url$", myArr[i].url)
			arrayContent.push(html)
		}
		// document.getElementById("album").innerHTML = html;
		var isi = "";
		for (var i=0; i<arrayContent.length; i++){
			isi += arrayContent[i];
		}
		document.getElementById("album").innerHTML = isi
		
	}
};

function search() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "../content/content.txt", true);
	xmlhttp.send();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var myArr = JSON.parse(this.responseText);
			var search = document.getElementById("search");
			var value = search.value;
			for(var i=0; i<myArr.length; i++){
				var title = myArr[i].title.toLowerCase();
				var id = myArr[i].id;
				if(title.search(value.toLowerCase()) > -1)
				{
					window.location.href = "#"+id;
				}
				
			}
			
		}
	};
}