/**
 * @author Jorge@geo-thinking.com
 */
var source_graphic;
var geometryService;
var geometry_union;

require([
	"dojo/ready",
    "dojo/parser",
    "dijit/layout/BorderContainer", 
    "dijit/layout/ContentPane",
    "dijit/layout/AccordionContainer",
    "dijit/layout/TabContainer",
    "dijit/form/DropDownButton",
    "dijit/form/Button",
    "dijit/Dialog",
    "dijit/DropDownMenu", 
    "dijit/MenuItem",
    "dijit/Toolbar",
    "dojo/_base/fx",
    "dojox/charting/Chart",
    "dojox/charting/plot2d/Pie", 
    "dojox/charting/action2d/Highlight",
    "dojox/charting/action2d/MoveSlice" , 
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/themes/MiamiNice",
    "dojox/charting/widget/Legend",
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
	]);

var bookmark = 
{
	cargar : function (){
		if (localStorage.getItem("marcadoresODL")!=null)
		{
			var marcadores = JSON.parse(localStorage.getItem("marcadoresODL"));
			var form = dojo.create("form",{
				style: "padding: 10px;"
			});
			for (var i=0; i<marcadores.length; i++)
			{
				var a1=dojo.create("input",{type:"checkbox",name:marcadores[i].nombre,value:i,style:"margin-right: 5px;"});
				var a2=dojo.create("span",{
					innerHTML:marcadores[i].nombre,
					onclick: "bookmark.gotoExtent("+i+");"
				});
				var a3=dojo.create("br");
				bookmark.valores[i] = marcadores[i].valor;
				form.appendChild(a1);
				form.appendChild(a2);
				form.appendChild(a3);
			}
			while(dojo.byId("bookmarkList").firstChild)
			{
				dojo.byId("bookmarkList").removeChild(dojo.byId("bookmarkList").firstChild);
			}
			dojo.byId("bookmarkList").appendChild(form);
		}
		else
		{
			document.getElementById("bookmarkList").innerHTML="No hay marcadores";
		}
	},
	add : function (){
		var name=(dojo.byId("textoMarcador").value=="")?"Marcador Indefinido":dojo.byId("textoMarcador").value;
		var nuevo = {
		 nombre: name,
		 valor: map.extent
		};
		if(localStorage.getItem("marcadoresODL")!=null){
			try{
			var anterior = JSON.parse(localStorage.getItem("marcadoresODL"));
			anterior.push(nuevo);
			localStorage.setItem("marcadoresODL", JSON.stringify(anterior));
			}catch(e){
				alert("Marcadores corruptos, se borrarÃ¡n sus marcadores");
				localStorage.removeItem("marcadoresODL");
			}
		}
		else
		{
			var primero = new Array();
			primero.push(nuevo);
			localStorage.setItem("marcadoresODL", JSON.stringify(primero));	
		}
		bookmark.cargar();
	},
	remove : function (){
		var marcadores = document.getElementById("bookmarkList").getElementsByTagName("input");
		var toRemove = new Array();
		for (var i=0; i<marcadores.length; i++)
		{
			if(marcadores[i].checked==true)
			{
				toRemove.push(i);
			}
		}
		toRemove.reverse();
		var guardado = JSON.parse(localStorage.getItem("marcadoresODL"));
		console.log(guardado,toRemove);
		for(var i=0; i<toRemove.length; i++){
			guardado.splice(toRemove[i],1);
		}
		localStorage.setItem("marcadoresODL", JSON.stringify(guardado));
		bookmark.cargar();
	},
	valores : new Array(),
	gotoExtent: function(i){
		var ext = bookmark.valores[i];
		var bound =  new esri.geometry.Extent({xmin:ext.xmin,ymin:ext.ymin,xmax:ext.xmax,ymax:ext.ymax,spatialReference:{wkid:ext.spatialReference.wkid}});
		map.setExtent(bound);
	}
};

var queryAttr = {
ponerEnLista: function (features){
	var contenedor = document.getElementById("resultadosAtributo");
	while(contenedor.firstChild)
	{
		contenedor.removeChild(contenedor.firstChild);
	}
	features = features.features;
	var ul = document.createElement("ul");
	for (var i=0; i<features.length; i++)
	{
		var li = document.createElement("li");
		li.innerHTML = features[i].attributes.Nombre;
		li.setAttribute("onclick", "queryAttr.ira("+features[i].attributes.OBJECTID+")");
		ul.appendChild(li);
	}
	contenedor.appendChild(ul);
},
ira: function(id){
	juu.search({capa:20,ids:[id],campos:["*"],ifgeom:true,funSal:function (res){queryAttr.zoomto(res);queryAttr.putFlotante(res);}});
},
zoomto: function (deferred){
	var geometry = deferred.features[0].geometry;
	map.setExtent(geometry.getExtent().expand(3));
	queryAttr.putGraphics([{geometry:geometry}]);
},
putGraphics: function (features){
	var highlightSymbol = new esri.symbol.SimpleFillSymbol(
          esri.symbol.SimpleFillSymbol.STYLE_SOLID, 
          new esri.symbol.SimpleLineSymbol(
            esri.symbol.SimpleLineSymbol.STYLE_SOLID, 
            new dojo.Color([255,0,0]), 3
          ), 
          new dojo.Color([125,125,125,0.35])
     );
     map.graphics.clear();
     dojo.forEach(features, function (elem){
     var highlightGraphic = new esri.Graphic(elem.geometry,highlightSymbol);
     	map.graphics.add(highlightGraphic);
     });
},
putFlotante: function (resultado){
	console.log(resultado);
	var texto = new String;
	for (var i in resultado.features[0].attributes)
	{
		texto += "<b>"+i+": </b>"+resultado.features[0].attributes[i]+"<br/>";
	}
	juu.flotante(texto);
},
};

function buscarPorAtributo(evt){
	if (evt.keyCode==13)
	{
		var field = document.getElementById("nombreAtributo").value;
		var texto = document.getElementById("valorAtributo").value;
		texto = texto.toUpperCase();
		document.getElementById("resultadosAtributo").innerHTML="Cargando...";
		if(field=="Nombre"||field=="CSIT")
		{
			juu.search({capa:20,campo:field,valor:texto,campos:["Nombre","OBJECTID"],ifgeom:false,funSal:queryAttr.ponerEnLista});
		}
		else if(field=="Propietario")
		{
			juu.search({capa:27,campo:"Nombres",valor:texto,campos:["CSIT_Predio"],ifgeom:false,
			funSal:function (nombres){
				juu.search({capa:27,campo:"Apellidos",valor:texto,campos:["CSIT_Predio"],ifgeom:false,
				funSal:function (apellidos){
					console.log(nombres,apellidos);
				}});
			}});
		}
		else if(field=="MatriculaInmobiliaria")
		{
			juu.search({capa:27,campo:field,valor:texto,campos:["CSIT_Predio","OBJECTID"],ifgeom:false,
			funSal:function (matricula){
				var features = matricula.features;
				var sqlgen = juu.sqlGen("CSIT",features,"CSIT_Predio");
				juu.search({capa:20,sql:sqlgen,campos:["Nombre","OBJECTID"],ifgeom:false,funSal:queryAttr.ponerEnLista});	
			}});
		}
	}
}

/*********************************************************************************************
 * Esta función se agrega para hacer la consulta ambiental sobre un elemento de tipo predio
 * se incia con la opción de dibujar un elemento grafico que sirve para hacer la consulta por
 * grafico 
**********************************************************************************************/

var onDrawEnd;
function selectByGeometry(tipo_geometria)
{
	dojo.disconnect(onmapclick);
	map.graphics.clear();
	onDrawEnd=dojo.connect(drawtoolbar, "onDrawEnd", addGraphic);
	switch(tipo_geometria)
	{
		case "punto":
			drawtoolbar.activate(esri.toolbars.Draw.POINT);
			break;
		case "linea":
			drawtoolbar.activate(esri.toolbars.Draw.POLYLINE);
			break;
		case "poligono":
			drawtoolbar.activate(esri.toolbars.Draw.POLYGON);
			break;
		default:
			break;
	}
}

/******************************************************************************************************
 * Este metodo responde al evento onDrawEnd
 ******************************************************************************************************/
function addGraphic(geometry)
{
	drawtoolbar.deactivate();
	map.enableMapNavigation();
	var symbol=createSymbol(geometry);
	map.graphics.add(new esri.Graphic(geometry, symbol));
	var layerConfig=searchLayerConfig(20);
	if(layerConfig != null)
	{
		dojo.disconnect(onDrawEnd);
		queryLayerByGeometry(layerConfig, geometry);
	}
}

/******************************************************************************************************
 * Este metodo sirve para crear un elemento de tipo symbol dependiendo del tipo de geometria que se pase
 ******************************************************************************************************/
function createSymbol(geometry)
{
	//console.log(geometry.type);
	var symbol=null;
	switch(geometry.type)
	{
	 	case "point":
	 		symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,255,0]), 1), new dojo.Color([0,255,0,0.25]));
	 	break;
	 	case "polyline":
	 		symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([255,0,0]), 1);
        break;
	 	case "polygon":
	 		symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NONE, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255,0,255]), 2), new dojo.Color([255,0,0,0.25]));
        break;
	}
	return symbol;
}

/******************************************************************************************************
 * Este metodo sirve para buscar un layer o servicio definido en el formato de configuración en este caso
 * se busca el layer por el Id teniendo en cuenta los layers en un servicio dinamico 
 ******************************************************************************************************/
function searchLayerConfig(layerId)
{
	var length=confData.length;
	//console.log(length);
	for(var i=0;i <length ;i++)
	{
		var layerConf=confData[i];
		if(layerConf["layerId"]==layerId)
		{
			//console.log(i + layerConf["url"]);
			return layerConf;
		}
	}
	return null;
}

/******************************************************************************************************
 * Este metodo sirve para buscar un layer o servicio definido en el formato de configuración en este caso
 * se busca el layer por el nombre teniendo en cuenta que hay servicios que no necesariamente corresponden
 * a un layer (geometry, geprocessor)  
 ******************************************************************************************************/
function searchLayerConfigByName(layerName)
{
	var length=confData.length;
	//console.log(length);
	for(var i=0;i <length ;i++)
	{
		var layerConf=confData[i];
		if(layerConf["name"]==layerName)
		{
			//console.log(i + layerConf["url"]);
			return layerConf;
		}
	}
	return null;
}

/******************************************************************************************************
 * Esta variable recibe la definición del evento onComplete del objeto queryTask y se necesita para 
 * desconectar el evento y evitar que que se siga propagando cada que vez que se envie una petición
 * al servidor
 ******************************************************************************************************/
var onExecute_query;

function queryLayerByGeometry(layerConfig, geometry)
{
	try
	{
		var queryTask=new esri.tasks.QueryTask(layerConfig["url"]);
		var query=new esri.tasks.Query();
		query.geometry=geometry;
		query.spatialRelationship=esri.tasks.Query.SPATIAL_REL_INTERSECTS;
		query.returnGeometry=true;
		query.geometryPrecision=1;
		
		//Es posible definir los campos a ser consultados en el formato de configuración 
		query.outFields=["OBJECTID","CSIT","CAOI","SHAPE_Length","SHAPE_Area"];
		
		onExecute_query= dojo.connect(queryTask, "onComplete", queryResponse);
		queryTask.execute(query);
	}
	catch(err)
	{
		console.log(err.message);
	}
	
}

/******************************************************************************************************
 * Este metodo corresponde al evento onComplete del objeto queryTask
 * Una vez se obtiene la respuesta se envia una petición al servicio de geometria para hacer una operación
 * de unión de geometrias si la respuesta contiene mas de un feature, es decir la consulta puede retornar
 * mas de un elemento
 ******************************************************************************************************/
function queryResponse(featureset)
{
	//Esta variable se define para almacenar varias geometrias
	var geometryBag=new Array();
	
	//se obtiene el objeto(JSON) en donde se define le servicio de geometria 
	var layerConfig=searchLayerConfigByName("geometry");
	
	//Se crea el objeto geometryService con la url correspondiente
	geometryService=new esri.tasks.GeometryService(layerConfig["url"]);
	
	try
	{
		//console.log("Numero de features:" + featureset.features.length);
		if(featureset.features.length>0)
		{
			var symbol=createSymbol(featureset.features[0].geometry);
			for(var i=0; i<featureset.features.length;i++)
			{
				console.log(featureset.features[i].attributes["SHAPE_Area"]);
				source_graphic=new esri.Graphic(featureset.features[i].geometry,symbol,featureset.features[i].attributes);
				map.graphics.add(source_graphic);
				geometryBag[i]=featureset.features[i].geometry;
			}
			
			//Se envia una petición al servicio de eometria para hacer la unión de las geometrias producto
			//del query
			geometryService.union(geometryBag, onUnionComplete);
			
			//Se desconecta el evento OnComplete del objeto queryTask para que no se propague el evento
			dojo.disconnect(onExecute_query);
		}
		
		else
		{
			return;
		}
	}
	catch(err)
	{
		console.log(err.message);
	}
	
	
}

/*****************************************************************************************************
 * Esta variable sirve para definir el primer parametro necesario para enviar la solicitud de 
 * interseccción al servicio de geoprocesamiento, esta varialbe es de tipo FeatureSet
 *****************************************************************************************************/
var input_1; 

/******************************************************************************************************
 * Este metodo corresponde al evento union-complete del objeto geometryService
 ******************************************************************************************************/
function onUnionComplete(geometry)
{
	try
	{
		//Se crea el objeto de tipo FeaturesSet y se define el tipo de geometria
		input_1=new esri.tasks.FeatureSet();
		input_1["geometryType"]="esriGeometryPolygon";
		
		//Se define un feature con el resultado del llamado a lservicio geometryService y se llena el 
		//atributo features del objeto FeatureSet
		var feature_1=new esri.Graphic(geometry,null, source_graphic.attributes);
		input_1.features.push(feature_1);
		
		var polygons=new Array();
		polygons[0]=geometry;
		
		//var areaParameters=esri.tasks.AreasAndLengthsParameters();
		//areaParameters.areaUnit=esri.tasks.GeometryService.UNIT_HECTARES;
		//areaParameters.preserveShape="preserveShape";
		//areaParameters.polygons=polygons;
		//geometryService.areasAndLengths(areaParameters, areaParametersComplete);
		geometry_union=polygons[0];
		//console.log("paso");
	}
	catch(err)
	{
		console.log(err);
	}
	
}

/*function areaParametersComplete(areaParameters)
{
	console.log("areaParameters");
	console.log(areaParameters.areas[0]);
}*/

/**********************************************************************************************************
 * Esta función es llamada por el boton etiquetado Consulta Cobertura Vegetal teniendo en cuenta que 
 * en este punto ya esta definida la geometria (unión) a partir de la cual se va a hacer la consulta y
 * posterior corte con los elementos en la capa CoberturaCampo 
 *********************************************************************************************************/
function ConsultaCoberturaVegetal()
{
	var query=new esri.tasks.Query();
	query.geometry=geometry_union;
	query.spatialRelationship=esri.tasks.Query.SPATIAL_REL_INTERSECTS;
	query.returnGeometry=true;
	query.geometryPrecision=1;
	
	//Es posible definir los campos a ser consultados en el formato de configuración 
	query.outFields=["OBJECTID","Cantidad","Unidad","Observaciones","TipoCobertura","DescripcionCobertura","SHAPE.STLength()","SHAPE.STArea()"];
	var layerConf=searchLayerConfig(17);
	if(layerConf!=null)
	{
		var queryTask=new esri.tasks.QueryTask(layerConf["url"]);
		queryTask.execute(query, queryCoberturaResponse);
	}
}

/**********************************************************************************************************
 * Este metodo corresponde al evento onExecute del objeto queryTask 
 *********************************************************************************************************/
function queryCoberturaResponse(featureset)
{
	try
	{
		var _featureset=createFeaturesetForIntersect(featureset);
		
		//Se obtiene la referencia al servicio de geoprocesamiento definido en el archivo de configuración
		var layerConf=searchLayerConfigByName("gpintersectar");
		var gpintersectar=new esri.tasks.Geoprocessor(layerConf["url"]);
		var params={"Cobertura":_featureset, "Predio":input_1,"Predio_Rank":1, "Cobertura_Rank":2};
		gpintersectar.execute(params, onExecuteComplete, onerror);
		//console.log(_featureset);
		for(var i=0; i<featureset.features.length; i++)
		{
			var symbol=createSymbol(featureset.features[i].geometry);
			var _graphic=featureset.features[i];
			map.graphics.add(new esri.Graphic(_graphic.geometry, symbol));
			//console.log(_graphic);
		}
		//console.log("resultado" + featureset.features.length);
	}
	catch(err)
	{
		console.log(err.message);
	}
	
}

function createFeaturesetForIntersect(featureset)
{
	var input_2=new esri.tasks.FeatureSet();
	var features=[];
	for(var i=0;i<featureset.features.length;i++)
	{
		var attributes=featureset.features[i].attributes;
		var _attributes=new Object();
		for(var name in attributes)
		{
			//console.log(attributes[name]);
			if(name!="SHAPE.STArea()" && name!="SHAPE.STLength()")
			{
				_attributes[name]=attributes[name];
			}
			if(name=="SHAPE.STArea()")
			{
				_attributes["SHAPE_Area"]=attributes[name];
			}
			if(name=="SHAPE.STLength()")
			{
				_attributes["SHAPE_Length"]=attributes[name];
			}
		}
		
		var _feature=new esri.Graphic(featureset.features[i].geometry,null,_attributes);
		//console.log(_feature);
		features.push(_feature);
	}
	input_2.geometryType="esriGeometryPolygon";
	input_2.features=features;
	return input_2;
}

function onExecuteComplete(parameterValue, gpmessaje)
{
	console.log(parameterValue);
	createChart(parameterValue);
	//console.log(gpmessaje);
}

function onerror(error)
{
	console.log(error.name + "--" + error.message);
}

function createChart(seriesSource)
{
	var pieChart=new dojox.charting.Chart("chartnode");
	var data=createSeries(seriesSource);
	console.log(data);
	pieChart.addPlot("default", 
			{
        		type: dojox.charting.plot2d.Pie,
        		font: "normal normal 11pt Tahoma",
        		fontColor: "black",
        		labelOffset: -30,
        		radius: 80
			});
	pieChart.addSeries("serie 1", data);
	pieChart.render();
}

function createSeries(parameterValue)
{
	var features=parameterValue[0].value.features;
	var existe;
	
	var data=[];
	for(var i=0;i<features.length; i++)
	{
		var attributes=features[i].attributes;
		existe=searchValue(attributes["Observaciones"], data);
		if(existe==-1)
		{
			//console.log("no repite");
			var serie=new Object();
			serie.y=attributes["SHAPE_Area"];
			serie.text=attributes["Observaciones"];
			data.push(serie);
		}
		else
		{
			//console.log("repite");
			var _serie=data[existe];
			_serie.y=_serie.y + attributes["SHAPE_Area"];
		}
	}
	return data;
}

function searchValue(value, values)
{
	//console.log(value);
	for(var i=0; i<values.length; i++)
	{
		var _serie=values[i];
		if(_serie.text==value)
		{
			return i;
		}
	}
	return -1;
}

function queryError(error)
{
	
}

function consultarPorFigura(tipo){
	document.getElementById("contenedorFigura").style.display="block";
	document.getElementById("contenedorPK").style.display="none";
	map.hideZoomSlider();
	if (tipo=="punto"){
		drawtoolbar.activate(esri.toolbars.Draw.POINT);
	}
	else if(tipo=="linea"){
		drawtoolbar.activate(esri.toolbars.Draw.POLYLINE);
	}
	else if(tipo=="poligono"){
		drawtoolbar.activate(esri.toolbars.Draw.POLYGON);
	}
}

function consultarPorPK(){
	document.getElementById("contenedorFigura").style.display="none";
	document.getElementById("contenedorPK").style.display="block";
}

function endDraw(geometry) 
{
	/*
    drawtoolbar.deactivate();
    map.showZoomSlider();
    map.graphics.clear();
    map.enableDoubleClickZoom();
    switch (geometry.type) {
         case "point":
           var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 1), new dojo.Color([0,255,0,0.25]));
           break;
         case "polyline":
           var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([255,0,0]), 1);
           break;
         case "polygon":
           var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NONE, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255,0,0]), 2), new dojo.Color([255,255,0,0.25]));
           break;
      }
	makeZoomAddGraphics(geometry);
	var graphic = new esri.Graphic(geometry, symbol);
    map.graphics.add(graphic);
 	var tamanoBuffer=document.getElementById("bufferde").value;
 	if (tamanoBuffer=="")juu.alert("Asigne un TamaÃ±o de Buffer");
 	if(tamanoBuffer!=0)
 	{
 		var params = new esri.tasks.BufferParameters();
	    params.distances = [ tamanoBuffer/1000 ];
	    params.bufferSpatialReference = new esri.SpatialReference({wkid: 102100});
	    params.outSpatialReference = map.spatialReference;
	    params.unit = esri.tasks.GeometryService["UNIT_KILOMETER"];
	    if (geometry.type === "polygon") {
	    //if geometry is a polygon then simplify polygon.  This will make the user drawn polygon topologically correct.
		    gsvc.simplify([geometry], function(geometries) {
			    params.geometries = geometries;
		    	gsvc.buffer(params, showBuffer);
		    });
	    } else {
	        params.geometries = [geometry];
	        gsvc.buffer(params, showBuffer);
	    }
    }
    else
    {
    	buscarPorGeometria(geometry);
    }*/
}

function showBuffer(bufferedGeometries) {
  var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0,0.65]), 2), new dojo.Color([255,0,0,0.35]));
  var figura = null;
  dojo.forEach(bufferedGeometries, function(geometry) {
    var graphic = new esri.Graphic(geometry, symbol);
    map.graphics.add(graphic);
    figura = graphic;
  });  
  buscarPorGeometria(figura.geometry);
}
 
function makeZoomAddGraphics(graphics)
{
	/*extension.xmin = extension.xmin - 106400.343372919;
	extension.xmax = extension.xmax + 106400.343372919;*/
	if(graphics.getExtent()!=null)map.setExtent(graphics.getExtent().expand(3));
	//switchLeftPaneContent(1);
}

function buscarPorGeometria(graphic){
  	juu.search({capa:20,geometria:graphic,campos:["Nombre","OBJECTID"],ifgeom:true,funSal:resaltarGeometria});
}

function resaltarGeometria(queryResult){
	var features = queryResult.features;
	if(features.length == 0)
	{
		juu.alert("La consulta espacial no retorna elementos.");
	}
	else{
		queryAttr.putGraphics(features);
		var contenedor = document.getElementById("resultadosGeometria");
		while(contenedor.firstChild)
		{
			contenedor.removeChild(contenedor.firstChild);
		}
		var ul = document.createElement("ul");
		for (var i=0; i<features.length; i++)
		{
			var li = document.createElement("li");
			li.innerHTML = features[i].attributes.Nombre;
			li.setAttribute("onclick", "queryAttr.ira("+features[i].attributes.OBJECTID+")");
			ul.appendChild(li);
		}
		contenedor.appendChild(ul);
	}
}






