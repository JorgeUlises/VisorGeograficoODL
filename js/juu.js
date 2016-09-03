var juunodoAnterior;
var juuidAnterior;
var juu = {
dialog : {
	change : function (id,dialogo) {
		if (window.getComputedStyle(document.getElementById("aside"),null).getPropertyValue("display")!="none")//como panel
		{
			juu.dialog.refresh();
			juu.dialog.movera(id,"aside");
			var element = document.getElementById(id);
			var property = window.getComputedStyle(element,null).getPropertyValue("display");
			if(property!="none"){
				element.style.display="none";
			}
		}
		else//como móvil
		{
			document.onkeydown = function (e){if(e.keyCode==27){juu.dialog.change(id,dialogo); document.onkeydown=null;}}
			var element = document.getElementById(id);
			var property = window.getComputedStyle(element,null).getPropertyValue("display");
			if(property=="none"){
				element.style.display="block";
				juu.dialog.refresh();
			}
			else{
				element.style.display="none";
			}
		}
	},
	clonara : function (idf,idd) {
		var fuente = document.getElementById(idf);
		var destino = document.getElementById(idd);
		while (destino.firstChild)
		{
			destino.removeChild(destino.firstChild);
		}
		var clonfuente = fuente.getElementsByClassName("content")[0].cloneNode(true);
		clonfuente.className = "aside div";
		destino.appendChild(clonfuente);
	},
	movera : function (idf,idd) {
		var fuente = document.getElementById(idf);
		var destino = document.getElementById(idd);
		juunodoAnterior = fuente.getElementsByClassName("content")[0];
		juuidAnterior = idf;
		destino.innerHTML = "";
		destino.appendChild(juunodoAnterior);
	},
	refresh: function () {
		try{
			var anterior = document.getElementById(juuidAnterior).getElementsByClassName("container")[0];
			//console.log(anterior);
			anterior.appendChild(juunodoAnterior);
		}catch(e){console.log("No hay nodo");}
	},
},
alert : function (mensaje){
	var ele1 = document.createElement("div");
	var ele2 = document.createElement("div");
	var ele3 = document.createElement("div");
	ele1.className = "juu box";
	ele1.addEventListener("click",function (){ele1.parentNode.removeChild(ele1)}, false);
	ele1.style.display = "block";
	ele2.className = "juu alert";
	ele3.style.textAlign = "center";
	ele3.style.wordWrap = "break-word";
	ele3.innerHTML = mensaje+"";
	ele2.appendChild(ele3);
	ele1.appendChild(ele2);
	document.getElementsByTagName("body")[0].appendChild(ele1);
},
flotante : function (html){
	var div = dojo.create("div",{id:"flotanteInfo",innerHTML:html,onclick:"juu.rmFlotante();"});
	if (isMobile){
		div.style.width="auto";
		div.style.left="3px";
	}
	else {
		div.style.width="285px";
		div.style.left="inherit";
	}
	document.body.appendChild(div);
},
rmFlotante : function (){
	while(document.getElementById("flotanteInfo")){document.getElementById("flotanteInfo").remove();}
},
search: function (obj){
	//obj.campo,valor,ids,campos,ifgeom,funSalida
	var featureLayer=new esri.tasks.QueryTask("http://50.62.42.205:6080/arcgis/rest/services/inmobiliaria/MapServer/"+obj.capa);
    var query=new esri.tasks.Query();
    query.outFields=obj.campos;
    query.returnGeometry = obj.ifgeo;
    query.outSpatialReference = new esri.SpatialReference(map.spatialReference.wkid);
    if(typeof(obj.ids)!="undefined")//buscar por ids
    {
    	query.objectIds=obj.ids;
    }
    else if(typeof(obj.campo)!="undefined")//buscar por campo
    {
    	query.where = obj.campo+" like '%"+obj.valor+"%'";
    }
    else if(typeof(obj.geometria)!="undefined")//buscar por geometría
    {
    	query.geometry = obj.geometria;
    	query.geometryPrecision = 1;
    }
    else if(typeof(obj.sql)!="undefined")
    {
    	query.where = obj.sql;
    }
    featureLayer.execute(query, obj.funSal, juu.alert);
},
sqlGen: function (field,features,attrib){
	var sqlgen = new String;
	for (var i=0; i<features.length; i++)
	{
		if(i==0){
			sqlgen += field+"='"+features[i].attributes[attrib]+"'";
		}else{
			sqlgen += " OR "+field+"='"+features[i].attributes[attrib]+"'";
		}
	}
	return sqlgen;
},
}

var makeMovable = function(ele) {
if("ontouchstart" in document.documentElement)
{
  ele.ontouchstart = function(evts) {
	evts.preventDefault();
	var initialOffsetT = -5;//ele.parentNode.offsetTop;
	var timer = null;
	var firstTime = true;
	var mover = function (event){
	  ele.parentNode.style.top = (event.touches[0].pageY-initialOffsetT)+"px";	
      ele.parentNode.style.height = (document.body.offsetHeight*0.95-event.touches[0].pageY)+"px";
	  if(ele.parentNode.offsetTop>document.body.offsetHeight*0.8)
	  {
	  	clearInterval(timer);
		ele.ontouchend();
	  }
	}
	var cancelarEvt = function (){
	  var count = 0;
      timer = setInterval(function (){
  		count+=10;
  		var obj = {parentNode: ele.parentNode, touches: [{pageY: count}]};
  		mover(obj);
  		},30);
	}
    document.ontouchmove = function(event) {
      if(firstTime){
	      if(ele.parentNode.offsetTop>document.body.offsetHeight*0.05)
		  {
		  	firstTime = false;
		  	cancelarEvt();
	      }
	      else
	      {
	      	mover(event);
	      }
      }
    }
    document.ontouchend = function(evt) {
      ele.ontouchend();
    }
    document.ontouchcanceled = function(evt){
      ele.ontouchend();
    }
    ele.ontouchend = function(evt){
      clearInterval(timer);
	  document.ontouchmove = null;
	  document.ontouchend = null;
	  ele.ontouchend = null;
	  juu.dialog.change(ele.parentNode.parentNode.id);
	  ele.parentNode.style.height = "95%";
	  ele.parentNode.style.top = "0px";
	 }
	 //evts.stopPropagation();
  }
}
else
{
	ele.onmousedown = function() {
	initialOffsetT = ele.parentNode.offsetTop;
    document.onmousemove = function(event) {
      	ele.parentNode.style.top = (event.y-initialOffsetT)+"px";
      	ele.parentNode.style.height = (document.body.offsetHeight*0.95-event.y)+"px";
		if(ele.parentNode.offsetTop>document.body.offsetHeight*0.95)
		{
			document.onmouseup();
		}
    }
    document.onmouseup = function() {
      document.onmousemove = null;
      document.onmouseup = null;
      juu.dialog.change(ele.parentNode.parentNode.id);
      ele.parentNode.style.height = "95%";
      ele.parentNode.style.top = "0px";
    }
    return false;
  	}
}
} 

for (var i=0; i<document.getElementsByClassName("juu dialog titlebar").length; i++)
{
	makeMovable(document.getElementsByClassName("juu dialog titlebar")[i]);
}

var cambiarPestana = function(padre,hijo,elemento){
	for (var i = 0; i<document.getElementsByClassName("juu tab content")[padre].getElementsByClassName("juu tab item").length; i++)
	{
		if (i!=hijo)
		{
			document.getElementsByClassName("juu tab content")[padre].getElementsByClassName("juu tab item")[i].style.display = "none";
		}
		else
		{
			document.getElementsByClassName("juu tab content")[padre].getElementsByClassName("juu tab item")[i].style.display = "block";
		}
	}
	for (var i=0; i<document.getElementsByClassName("juu tab list").length; i++)
	{
		var lista = document.getElementsByClassName("juu tab list")[i];
		for (var j=0; j<lista.getElementsByClassName("juu tab title").length; j++)
		{
			dojo.removeClass(lista.getElementsByClassName("juu tab title")[j],"select");
		}
	}
	dojo.addClass(elemento,"select");
}

for (var i=0; i<document.getElementsByClassName("juu tab list").length; i++)
{
	var lista = document.getElementsByClassName("juu tab list")[i];
	for (var j=0; j<lista.getElementsByClassName("juu tab title").length; j++)
	{
		lista.getElementsByClassName("juu tab title")[j].setAttribute("onclick","cambiarPestana("+i+","+j+",this)");
	}
}
























