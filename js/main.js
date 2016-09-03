var isMobile = false;
window.onresize = function ()
{
	var altura = parseFloat(window.getComputedStyle(document.getElementsByTagName("body")[0],null).getPropertyValue("height").split("px"));;
	var elementos = ["header","nav"];
	for (var i=0; i<elementos.length; i++)
	{
		if(window.getComputedStyle(document.getElementsByTagName(elementos[i])[0],null).getPropertyValue("display")!="none")
		{
			altura -= parseFloat(window.getComputedStyle(document.getElementsByTagName(elementos[i])[0],null).getPropertyValue("height").split("px"));
		}
	}
	var anchura = parseFloat(window.getComputedStyle(document.getElementsByTagName("body")[0],null).getPropertyValue("width").split("px"));
	var anchura2 = anchura;
	if(window.getComputedStyle(document.getElementById("aside"),null).getPropertyValue("display")!="none")
	{	
		isMobile=false;	
		var minanchura = 320;//parseFloat(window.getComputedStyle(document.getElementById("aside"),null).getPropertyValue("width").split("px"));
		anchura2 = anchura - minanchura;
		document.getElementById("main").style.width = anchura2+"px";
		document.getElementById("aside").style.width = minanchura+"px";
	}
	else{isMobile=true;}
	document.getElementById("main").style.width = anchura2+"px";
	document.getElementById("mainCenter").style.width = anchura+"px";
 	document.getElementById("mainCenter").style.height = altura+"px";
 	document.getElementById("main").style.height = altura+"px";
 	document.getElementById("aside").style.height = altura+"px";
}

require([
    "dojo/parser",
    "dijit/layout/BorderContainer", 
    "dijit/layout/ContentPane",
    "dijit/layout/AccordionContainer",
    "dijit/layout/TabContainer",
    "dijit/form/DropDownButton",
    "dijit/Dialog",
    "dijit/DropDownMenu", 
    "dijit/MenuItem",
    "dijit/Toolbar",
    "dijit/form/Button",
    "dojo/_base/fx",
	"esri/map",
	"esri/tasks/PrintTask",
	"esri/dijit/Legend",
	"esri/tasks/BufferParameters",
	"esri/layers/agsdynamic",
	"esri/dijit/BasemapGallery",
	"esri/dijit/Measurement",
	"esri/dijit/Scalebar",
	"esri/dijit/Geocoder",
	"agsjs/layers/GoogleMapsLayer",
	"dojo/dnd/Moveable",
	"esri/toolbars/Navigation",
	"esri/tasks/QueryTask",
	"esri/tasks/Query",
	"esri/toolbars/Draw",
	"esri/tasks/GeometryService",
	"esri/tasks/RelationParameters",
	"esri/layers/FeatureLayer",
	"esri/tasks/FeatureSet",
	"esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "dojo/fx",
    "agsjstoc/dijit/TOC",
    "dojo/domReady!"
	]);
	
require(["dojo/ready"], function(ready) {
    ready(function(){console.log("Estas usando Dojo Toolkit "+dojo.version.major + "." + dojo.version.minor + "." + dojo.version.patch+" en "+document.URL);
                     init();
                     createMap();
                     afterloading();
                    })
});	
	
function init(){
	document.getElementById("mainWindow").style.visibility = "visible";
	window.onresize();
}

var map,navtoolbar,drawtoolbar,gsvc,identifyTask,identifyParams,dynaLayer1; 
var onmapclick; 
//http://50.62.42.205:6080/arcgis/rest/services/inmobiliaria/MapServer
function createMap(){
var initialExtent = new esri.geometry.Extent({
	xmin : -8095940.8843285125,
	ymin : 522706.28377790516,
	xmax : -8016140.626798896,
	ymax : 557332.2575910434,
	"spatialReference" : {
		"wkid" : 102100
	}
});
var popup = new esri.dijit.Popup({
  fillSymbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2), new dojo.Color([255,255,0,0.25]))
}, dojo.create("div"));
popup.startup();
map = new esri.Map("map",{
  extent: initialExtent,
  basemap:"topo",
  //center:[-122.45,37.75], //long, lat
  //zoom:13,
  sliderStyle:"small",
  infoWindow: popup
});

identifyTask = new esri.tasks.IdentifyTask("http://50.62.42.205:6080/arcgis/rest/services/inmobiliaria/MapServer");
identifyParams = new esri.tasks.IdentifyParameters();
identifyParams.tolerance = 3;
identifyParams.returnGeometry = true;
identifyParams.layerIds = [20];
identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_VISIBLE;//esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
identifyParams.width  = map.width;
identifyParams.height = map.height;

onmapclick=dojo.connect(map,"onClick",executeIdentifyTask);

dojo.connect(navtoolbar, "onExtentHistoryChange", extentHistoryChangeHandler);

dynaLayer1 = new esri.layers.ArcGISDynamicMapServiceLayer("http://50.62.42.205:6080/arcgis/rest/services/inmobiliaria/MapServer", {
	id:"inmobiliaria",
  	showAttribution: false,
  	opacity: 0.5
});
//dynaLayer1.setVisibleLayers([27]);
map.addLayer(dynaLayer1);

}

function extentHistoryChangeHandler()
{
  	dijit.byId("zoomprev").disabled = navtoolbar.isFirstExtent();
	dijit.byId("zoomnext").disabled = navtoolbar.isLastExtent();
}

function executeIdentifyTask(evt) {
    /*identifyParams.geometry = evt.mapPoint;
	identifyParams.mapExtent = map.extent;
    var deferred = identifyTask.execute(identifyParams);
	deferred.addCallback(function(response) {
		return dojo.map(response, function(result) {
            var feature = result.feature;
            feature.attributes.layerName = result.layerName;
            /*
			for (var i=0; i<identifyData.servicios[identifyData.nservice].capas.length; i++)
			{	
				if(result.layerId == parseInt(identifyData.servicios[identifyData.nservice].capas[i].layerId))
				{	
					var contenido = "Capa: "+identifyData.servicios[identifyData.nservice].capas[i].nombre+"<br/>";
					for (var j=0; j<identifyData.servicios[identifyData.nservice].capas[i].campos.length; j++)
					{
						contenido = contenido+identifyData.servicios[identifyData.nservice].capas[i].campos[j].alias
									+" : ${"+identifyData.servicios[identifyData.nservice].capas[i].campos[j].field+"} <br/>";
					}
					var template = new esri.InfoTemplate("",contenido);
					feature.setInfoTemplate(template);
				}
			}*/
	/*		var contenido = new String;
			for (var i in feature.attributes)
			{
				contenido += "<b>"+i+":</b> "+feature.attributes[i]+"<br />";
			}
			var template = new esri.InfoTemplate(feature.attributes.layerName,contenido);
			feature.setInfoTemplate(template);
            return feature;
          });
	});
	map.infoWindow.setFeatures([ deferred ]);
    map.infoWindow.show(evt.mapPoint);
    */
}
function afterloading(){
gsvc = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
 navtoolbar = new esri.toolbars.Navigation(map);
drawtoolbar = new esri.toolbars.Draw(map);
dojo.connect(drawtoolbar,"onDrawEnd", endDraw);

var printer = document.getElementById("imprimir");
printer.addEventListener("click",tool.imprimir,false);

/*
var legend = new esri.dijit.Legend({
  map:map
},"legendDiv");
legend.startup();
*/
var basemapGallery = new esri.dijit.BasemapGallery({
  showArcGISBasemaps: true,
  //toggleReference: true,
  //bingMapsKey: 'Ah29HpXlpKwqVbjHzm6mlwMwgw69CYjaMIiW_YOdfTEMFvMr5SNiltLpYAcIocsi',
  bingMapsKey: "",
  google: {
    apiOptions: {
      v: '3.6' // use a specific version is recommended for production system.
    }
  },
  map: map
}, "basemapDiv");
basemapGallery.startup();
dojo.connect(basemapGallery, "onError", function(msg) {console.log(msg)});

var measurement = new esri.dijit.Measurement({
  map: map,
  defaultAreaUnit: esri.Units.SQUARE_KILOMETERS,
  defaultLengthUnit: esri.Units.KILOMETERS
}, dojo.byId('measurementDiv'));
measurement.startup();

var scalebar = new esri.dijit.Scalebar({map:map,attachTo:"bottom-left",scalebarUnit: "metric"});

var geocoder = new esri.dijit.Geocoder({ 
	map: map,
	autocomplete:true,
    arcgisGeocoder: {
	  placeholder: "Dirección o lugar",
	  //searchExtent: config.initialExtent
	}
}, "searchDiv");
geocoder.startup();

if(!isMobile)juu.dialog.change("dialogo4");

var toc = new agsjs.dijit.TOC({
    map: map,
    layerInfos: [/*{
      layer: featLayer1,
      title: "FeatureLayer1"
    }, */{
      layer: dynaLayer1,
      title: "Gestión Inmobiliaria"
      //collapsed: false, // whether this root layer should be collapsed initially, default false.
      //slider: false // whether to display a transparency slider.
    }]
  }, 'tocDiv');
toc.startup();

}

var tool = {
busy: false,
imprimir : function (){
	if(!tool.busy){
		tool.busy=true;
		var url = config.printService;
		var printTask = new esri.tasks.PrintTask(url);
		var params = new esri.tasks.PrintParameters();
		params.map = map;
		tool.cambiar("imprimir",true);
		var bucle0 = setInterval(function(){tool.cambiar("imprimir",true)},1000);
		printTask.execute(params, function(b){
			tool.busy=false;
			clearInterval(bucle0);
			tool.cambiar("imprimir",false);
			window.open(b.url,'_blank');
		}, function(e){clearInterval(bucle0);tool.cambiar("imprimir",false);juu.alert(e);tool.busy=false;});
	}
},
cambiar : function (id,opt){
	if(opt==true)
	{
		opt = dojo.getStyle(id,"opacity");
	}
	if(opt==0)
	{
		dojo.fadeIn({node:dojo.byId(id)}).play()
	}
	else
	{
		dojo.fadeOut({node:dojo.byId(id)}).play()
	}
},
}
