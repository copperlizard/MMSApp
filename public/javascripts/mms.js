var _PI = 3.14159265359;

var _mmsData, _matData, _unitData, _reelData; 

var _selMatName = null, _selMatSG = 0, _selMatDen = 0; //maybe don't store sg and den...

var _mmsDisplayDiv = '#mmsDataDiv_B';

var _mmsDisplayInterval = null;
var _mmsDisplayNameFieldUpdatePaused = false;

//DEBUG CLICK TEST
function WHOCLICK(me){
  window.event.stopPropagation();
  console.log(me + ' clicked!');
}

function PauseMMSDisplayNameFieldUpdate(){
  _mmsDisplayNameFieldUpdatePaused = !_mmsDisplayNameFieldUpdatePaused;
}

function SetDimensionUnit(dim, unit, refreshMMSDisp = true, refreshMMSSum = false){
  $(_unitData).find(dim).text(unit);
  SaveUnitData();
  if(refreshMMSDisp){
    UpdateMMSDataDisplay();
  }
  else if(refreshMMSSum){
    UpdateMMSSummaryDisplay();
  }
}

function GetSciUnitValue(dim, value){
  value = parseFloat(value);
    if(value == '' || isNaN(value)){
      console.log('cannot convert "" or NaN to sci unit! value == ' + value);
      return value;
    }

    switch(dim){
      case 'Weight': //Kg input...
	switch($(_unitData).find('Weight').text()){
	  case 'Kg':
	    return value;
	  case 'g':
	    return (Number(value) / 1000.0).toFixed(2);
	  case 'lb':
	    return (Number(value) / 2.20462).toFixed(2);
	  case 'oz':
	    return (Number(value) / 35.2739199982575).toFixed(2);
	  default:
	    return 'Error[Weight] in unit config file...';
	}
      case 'Length': //m input...
	switch($(_unitData).find('Length').text()){
	  case 'm':
	    return value;
	  case 'mm':
	    return (Number(value) / 1000.0).toFixed(2);
	  case 'ft':
	    return (Number(value) / 3.28084).toFixed(2);
	  case 'in':
	    return (Number(value) / 39.3701).toFixed(2);
	  default:
	    return 'Error[Length] in unit config file...';
	}
      case 'Density': //Kg/m^3 input...
	switch($(_unitData).find('Density').text()){
	  case 'Kg/m^3':
	    return value;
	  case 'g/cm^3':
	    return (Number(value) * 1000.0).toFixed(2);
	  case 'g/mm^3':
	    return (Number(value) * 1000000.0).toFixed(2);
	  case 'oz/in^3':
	    return (Number(value) / 0.000578036672).toFixed(2);
	  case 'lb/ft^3':
	    return (Number(value) / 0.0624279606).toFixed(2);
	  default:
	    return 'Error[Density] in unit config file...';
	}
      case 'MaterialDiameter': //mm input...
	switch($(_unitData).find('MaterialDiameter').text()){
	  case 'mm':
	    return value;
	  case 'in':
	    return (Number(value) / 0.0393701).toFixed(2);
	  default:
	    return 'Error[MaterialDiameter] in unit config file...';
	}
      default:
	return 'Error building sci unit string! "' + dim + '" not a valid dimension!';
    }
}

function GetDimensionDisplayString(dim, value){
  if(value == '' || isNaN(Number(value))){
    //console.log('cannot convert "" or NaN to display string!');
    return value;
  }
  switch(dim){
    case 'Weight': 
      switch($(_unitData).find('Weight').text()){
	case 'Kg':
          //console.log('value == ' + value);
	  return Number(value).toFixed(2) + ' Kg';
	case 'g':
	  return (Number(value) * 1000.0).toFixed(2) + ' g';
	case 'lb':
	  return (Number(value) * 2.20462).toFixed(2) + ' lb';
	case 'oz':
	  return (Number(value) * 35.2739199982575).toFixed(2) + ' oz';
	default:
	  return 'Error[Weight] in unit config file...'; 
      }          
    case 'Length': //m input...
      switch($(_unitData).find('Length').text()){
	case 'm':
	  return Number(value).toFixed(2) + ' m';
	case 'mm':
	  return (Number(value) * 1000.0).toFixed(2) + ' mm';
	case 'ft':
	  return (Number(value) * 3.28084).toFixed(2) + ' ft';
	case 'in':
	  return (Number(value) * 39.3701).toFixed(2) + ' in';
	default:
	  return 'Error[Length] in unit config file...';
	}
    case 'Density': //Kg/m^3 input...
      switch($(_unitData).find('Density').text()){
	case 'Kg/m^3':
	  return Number(value).toFixed(2) + ' Kg/m^3';
	case 'g/cm^3':
	  return (Number(value) / 1000.0).toFixed(2) + ' g/cm^3';
	case 'g/mm^3':
	  //return (Number(value) * (1000.0 / 1000.0)).toFixed(2) + ' g/mm^3';
	  return (Number(value) / 1000000.0).toFixed(2) + ' g/mm^3';
	case 'oz/in^3':
	  return (Number(value) * 0.000578036672).toFixed(2) + ' oz/in^3';
	case 'lb/ft^3':
	  return (Number(value) * 0.0624279606).toFixed(2) + ' lb/ft^3';
	default:
	  return 'Error[Density] in unit config file...';
      }
    case 'MaterialDiameter': //mm input...
      switch($(_unitData).find('MaterialDiameter').text()){
	case 'mm':
	  return Number(value).toFixed(2) + ' mm';
	case 'in':
	  return (Number(value) * 0.0393701).toFixed(2) + ' in';
	default:
	  return 'Error[MaterialDiameter] in unit config file...';
      }
    case 'Temperature' : //c input...
      switch($(_unitData).find('Temperature').text()){
        case 'centigrade':
          return Number(value).toFixed(2) + ' C';
        case 'fahrenheit':
          return (Number(value) * 1.8 + 32.0).toFixed(2) + ' F';
        default:
          return 'Error[Temperature] in unit config file...';
      }
    default:
      return 'Error building display string! "' + dim + '" not a valid dimension!'; 
  }
}

function MessageMMS(mmsID, message){
  //send xml to server...
  //console.log('Sending MMS[' + mmsID + '] message : ' + message);
  $.post('/messageMMS',
    {id: mmsID, mes: (message + '\u000D')},
    function(req, res){console.log('(MessageMMS) POST success!');},
    'text'
  );  
}

function ChangeUnitName(nameFieldID){
  //console.log('unit namefield focusout...');

  var unitID = nameFieldID.split('_')[0];

  $('#' + nameFieldID).val($('#' + nameFieldID).val().replace(/_/g, " "));

  //if name changed...
  if($(_mmsData).find('MMS[ID="' + unitID + '"]').find('Name').text() != $('#' + nameFieldID).val()){
    $(_mmsData).find('MMS[ID="' + unitID + '"]').find('Name').text($('#' + nameFieldID).val());
    SaveMMSData();
    MessageMMS(unitID, unitID + '_Name_' + $('#' + nameFieldID).val());
  }

  return false;
}

function SetNozzleDiameter(nozzle, dia = ''){
  var segs = nozzle.split('_');
  var mmsID = segs[0];
  var num = segs[2];

  if(dia != ''){
    $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Nozzle[num="' + num + '"]').find('SetDiameter').text(dia);
    SaveMMSData();
    MessageMMS(mmsID, mmsID + '_' + num + '_SetDiameter_' + dia);
  }
}

function SetMaterialDiameter(nozzle, dia = ''){
  var segs = nozzle.split('_');
  var mmsID = segs[0];
  var num = segs[2];

  if(dia != ''){
    $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Nozzle[num="' + num + 
      '"]').find('SetMaterialDiameter').text(dia);
    SaveMMSData();
    MessageMMS(mmsID, mmsID + '_' + num + '_SetMaterialDiameter_' + dia);
  }
}

function SetNozzleHighTemp(nozzleID){
  var segs = nozzleID.split('_');
  var mmsID = segs[0];
  var num = segs[2];

  var hightemp = $('#' + nozzleID + '_ht').prop( "checked" );
  
  $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Nozzle[num="' + num + '"]').find('SetHighTemp').text(hightemp);
  SaveMMSData();
  MessageMMS(mmsID, mmsID + '_' + num + '_SetHighTemp_' + hightemp); 
}

function SetNozzleAntiAbrasion(nozzleID){
  var segs = nozzleID.split('_');
  var mmsID = segs[0];
  var num = segs[2];

  var aa = $('#' + nozzleID + '_aa').prop( "checked" );

  console.log('aa == ' + aa);

  $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Nozzle[num="' + num + '"]').find('SetAntiAbrasion').text(aa);
  SaveMMSData();
  MessageMMS(mmsID, mmsID + '_' + num + '_SetAntiAbrasion_' + aa);
}

function SetNozzleSPFU(nozzleID){
  var segs = nozzleID.split('_');
  var mmsID = segs[0];
  var num = segs[2];

  var spfu = $('#' + nozzleID + '_spfu').prop( "checked" );

  console.log('spfu == ' + spfu);

  $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Nozzle[num="' + num + '"]').find('SetSPFU').text(spfu);
  SaveMMSData();
  MessageMMS(mmsID, mmsID + '_' + num + '_SetSPFU_' + spfu);
}

function SetReelExtruder(reel, ext = ''){
  var segs = reel.split('_');
  var mmsID = segs[0];
  var reelSlot = segs[2];

  if(ext != ''){
    $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Reel').each(function(){
      if($(this).find('SetExtNum').text() == ext){
        $(this).find('SetExtNum').text('0');
        MessageMMS(mmsID, mmsID + '_' + $(this).attr('slot') + '_SetExtNum_' + '0');
      }
    });
  }

  //Search mmsData for mms with matching id, then modify the specified reel's ExtNum node...
  $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Reel[slot="' + reelSlot +
    '"]').find('SetExtNum').text(ext);

  SaveMMSData();
  MessageMMS(mmsID, mmsID + '_' + reelSlot + '_SetExtNum_' + ext);
}

//Select/set reel filament diameter...
function SetReelDiameter(reel, dia = null){
  if(dia == null){
    dia = GetSciUnitValue('MaterialDiameter', $('#' + reel + '_input').val().replace(/_/g, " "));
    $('#' + reel + '_input').val('');
    //console.log('dia == ' + dia);

    if(dia == '' || isNaN(dia)){
      $('#' + reel + '_input').val('');
      return;
    }
  }
  var segs = reel.split('_');
  var mmsID = segs[0];
  var reelSlot = segs[2];

  //Search mmsData for mms with matching id, then modify the specified reel's material diameter node...
  $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Reel[slot="' + reelSlot +
    '"]').find('SetMaterialDiameter').text(dia);

  SaveMMSData();
  MessageMMS(mmsID, mmsID + '_' + reelSlot + '_SetMaterialDiameter_' + dia);
}

function AddReelType(id){
  if($('#' + id + '_newReelInput').val() == ''){
    console.log('invalid reel weight');
    return false;
  }

  var found = false;
  $(_reelData).find('Reel').each(function(){
    if($(this).find('LoadedWeight').text() == $('#' + id + '_newReelInput').val().replace(/_/g, " ")){
      found = true;
    }
  });

  if(found){
    console.log('loaded reel weight already exists!');
    return false;
  }

  var newReel = _reelData.createElement('Reel');
  var newReelLoadedWeight = _reelData.createElement('LoadedWeight');
  newReelLoadedWeight.appendChild(_reelData.createTextNode(GetSciUnitValue('Weight', $('#' + id + 
    '_newReelInput').val().replace(/_/g, " "))));
  newReel.appendChild(newReelLoadedWeight);
  var newReelEmptyWeight = _reelData.createElement('EmptyWeight');
  newReelEmptyWeight.appendChild(_reelData.createTextNode(''));
  newReel.appendChild(newReelEmptyWeight);

  $(_reelData).find(':root')[0].appendChild(newReel);

  ToggleReelMaterialDropDown(id);
  SortReels();
  SaveReelData();

  $(_reelData).find('Reel').each(function(idx){
    if($(this).find('LoadedWeight').text() == GetSciUnitValue('Weight', $('#' + id + 
      '_newReelInput').val().replace(/_/g, " "))){
      SelectReelWeight(id, idx);
    }
  });
}

function RemoveReelType(id, num){
  window.event.stopPropagation();
  if(!confirm('Delete Reel Type?')){
    return;
  }
  $(_reelData).find('Reel').eq(num).remove();
  ToggleReelMaterialDropDown(id); //no need for seperate dropdown function...
  SaveReelData();
}

//Select reel "type"...
function SelectReelWeight(reel, num){
  var segs = reel.split('_');
  var mmsID = segs[0];
  var reelSlot = segs[2];

  //Search mms reelData...
  var xmlReel = $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Reel[slot="' + reelSlot + '"]');

  var lrw = $(_reelData).find('Reel').eq(num).find('LoadedWeight').text();
  var erw = $(_reelData).find('Reel').eq(num).find('EmptyWeight').text();
  xmlReel.find('SetLoadedReelWeight').text(lrw);
  xmlReel.find('SetLoadedReelWeight').attr('emptyWeight', erw);
  xmlReel.find('LoadedReelWeight').attr('emptyWeight', erw);

  SaveMMSData();
  MessageMMS(mmsID, mmsID + '_' + reelSlot + '_SetLoadedReelWeight_' + lrw);
  MessageMMS(mmsID, mmsID + '_' + reelSlot + '_SetReelWeight_' + erw * 1000.0);
}

function UpdateReelWeight(id){
  var segs = id.split('_');
  var mmsID = segs[0];
  var reelSlot = segs[2];

  var loadedWeight = $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Reel[slot="' + reelSlot +
    '"]').find('SetLoadedReelWeight').text();

  $('#' + id + '_emptyWeightInput').val($('#' + id + '_emptyWeightInput').val().replace(/_/g, " "));
  var newEmptyWeight = GetSciUnitValue('Weight', Number($('#' + id + '_emptyWeightInput').val()));

  if(isNaN(newEmptyWeight) || newEmptyWeight == 0){
    console.log(id + '_emptyWeightInput is 0 or NaN');
    $('#' + id + '_emptyWeightInput').val(null);
    return;
  }

  MessageMMS(mmsID, mmsID + '_' + reelSlot + '_SetReelWeight_' + newEmptyWeight * 1000.0);

  var found = false;
  $(_reelData).find('Reel').each(function(){
    //console.log($(this).find('LoadedWeight').text());
    if($(this).find('LoadedWeight').text() == loadedWeight){
      found = true;
      if($(this).find('EmptyWeight').text() == ''){
        $(this).find('EmptyWeight').text(newEmptyWeight);
      }
      else{
	$(this).find('EmptyWeight').text(((Number($(this).find('EmptyWeight').text()) + newEmptyWeight)/2.0).toFixed(2));
      }
      //$(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Reel[slot="' + reelSlot + '"]').find('EmptyReelWeight').text($('#' + id + '_emptyWeightInput').val());

      $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Reel[slot="' + reelSlot + '"]').find('SetLoadedReelWeight').attr('emptyWeight', $('#' + id + '_emptyWeightInput').val().replace(/_/g, " "));

      $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Reel[slot="' + reelSlot + '"]').find('LoadedReelWeight').attr('emptyWeight', $('#' + id + '_emptyWeightInput').val().replace(/_/g, " "));

    }
  });      

  if(!found){
    console.log('fixing reel list...');
    var newReel = _reelData.createElement('Reel');
    var newReelLoadedWeight = _reelData.createElement('LoadedWeight');
    newReelLoadedWeight.appendChild(_reelData.createTextNode(loadedWeight));
    newReel.appendChild(newReelLoadedWeight);
    var newReelEmptyWeight = _reelData.createElement('EmptyWeight');
    newReelEmptyWeight.appendChild(_reelData.createTextNode(newEmptyWeight));
    newReel.appendChild(newReelEmptyWeight);
    $(_reelData).find(':root')[0].appendChild(newReel);
    SaveReelData(); 
  }

  $('#' + id + '_emptyWeightInput').val(null);

  SaveReelData();
  SaveMMSData();
}

//Select reel material...
function SelectReelMaterial(reel, num){
  var segs = reel.split('_');
  var mmsID = segs[0];
  var reelSlot = segs[2];

  //Search mmsData for mms with matching id, then modify the specified reel's material node...
  var mat = $(_matData).find('Material').eq(num).find('Name').text();
  $(_mmsData).find('MMS[ID="' + mmsID + '"]').find('Reel[slot="' + reelSlot + '"]').find('SetMaterial').text(mat);
      
  SaveMMSData();
  MessageMMS(mmsID, mmsID + '_' + reelSlot + '_SetMaterial_' + mat);

  //look up mat density and send to server...
  var den = $(_matData).find('Material').eq(num).find('Density').text() / 1000.0;
  //console.log('selected material density == ' + den);
  MessageMMS(mmsID, mmsID + '_' + reelSlot + '_SetDensity_' + den); 
}

//Sort material list...
function SortMaterials(){
  var sortedData = $(_matData).find('Material').sort(function(a, b){
    var nameA = $(a).find('Name').text().toUpperCase();
    var nameB = $(b).find('Name').text().toUpperCase();

    if(nameA < nameB){
      return -1;
    }
    else if(nameA > nameB){
      return 1;
    }
      return 0;
  });

  $(_matData).find('Material').each(function(){this.parentNode.removeChild(this);});

  var root = _matData.getElementsByTagName('Materials')[0];
  for(var i = 0; i < sortedData.length; i++){
    root.appendChild(sortedData[i]);        
  }
}

//Sort reel list...
function SortReels(){
  var sortedData = $(_reelData).find('Reel').sort(function(a, b){
    var weightA = $(a).find('LoadedWeight').text().toUpperCase();
    var weightB = $(b).find('LoadedWeight').text().toUpperCase();

    if(weightA < weightB){
      return -1;
    }
    else if(weightA > weightB){
      return 1;
    }
    return 0;
  });

  $(_reelData).find('Reel').each(function(){this.parentNode.removeChild(this);});

  var root = _reelData.getElementsByTagName('Reels')[0];
  for(var i = 0; i < sortedData.length; i++){
    root.appendChild(sortedData[i]);
  }
}

//Material selected from material settings drop down...
function SelectMaterial(num){
  console.log('selected mat#' + num);

  _selMatName = $(_matData).find('Material').eq(num).find('Name').text();
  _selMatSG = $(_matData).find('Material').eq(num).find('SpecificGravity').text();
  _selMatDen = $(_matData).find('Material').eq(num).find('Density').text();
  console.log(_selMatName);

  $('#matNameInput').val(_selMatName);
  $('#sgInput').val(_selMatSG);
  $('#denInput').val(GetDimensionDisplayString('Density', _selMatDen));

  ToggleMaterialDropDown();     
}

//Material selected by exact name from material settings name field...
function SelectMaterialName(name){
  $(_matData).find('Material').each(function(){
    if($(this).find('Name').text() == name){
      _selMatName = name;
      _selMatSG = $(this).find('SpecificGravity').text();
      _selMatDen = $(this).find('Density').text();

      $('#matNameInput').val(_selMatName);
      $('#sgInput').val(_selMatSG);
      $('#denInput').val(GetDimensionDisplayString('Density', _selMatDen));  
    }
  });
}

function AddMaterial(){
  if($('#matDropDown').is(':visible')){
    ToggleMaterialDropDown();
  }

  SelectMaterialName($('#newMatInput').val().replace(/_/g, " "));
      
  if($('#newMatInput').val() == _selMatName){
    console.log('material already exists');
    return false;
  }

  console.log('adding material');
  AddMaterialName($('#newMatInput').val());
  $('#newMatInput').val(null);
}

function AddMaterialName(name){
  if(name == ''){
    console.log('invalid new material name!');
    return;
  }

  name = name.replace(/_/g, " ");

  console.log('adding mateiral name: ' + name);

  $.get('matData.xml', function(matData){
    //get last second mat data incase of other user changes...
    _matData = matData;

    var newMat = _matData.createElement('Material');

    var newMatName = _matData.createElement('Name');
    newMatName.appendChild(_matData.createTextNode(name));
    newMat.appendChild(newMatName);

    var newMatSG = _matData.createElement('SpecificGravity');
    if($('#sgInput').val() != ''){
      newMatSG.appendChild(_matData.createTextNode($('#sgInput').val()));
    }
    newMat.appendChild(newMatSG);

    var newMatDen = _matData.createElement('Density');
    if($('#denInput').val() != ''){
      newMatDen.appendChild(_matData.createTextNode($('#denInput').val()));
    }
    newMat.appendChild(newMatDen);

    $(_matData).find(':root')[0].appendChild(newMat);

    //console.log(_matData);

    $('#matNameInput').val(name);
    _selMatName = name;

    SortMaterials();

    console.log('saving new material!');
    SaveMaterialData();
  });
}

function SetMaterialProperty(prop){
  //user never selected mat...
  if(_selMatName == null){
    if($('#matNameInput').val() == ''){
      console.log('cannot set material property with no material selected');
      return;
    }

    _selMatName = $('#matNameInput').val().replace(/_/g, " ");
    SelectMaterialName(_selMatName); //if material exists, update fields...
  }
  //ensure valid name...
  else{
    if(prop == 'Name'){
      if($('#matNameInput').val() == ''){
        $('#matNameInput').val(_selMatName);
        return;
      }
    }
  }

  //upadte mmsData with material name change...
  if(prop == 'Name'){
    $(_mmsData).find('MMS').each(function(){
      $(this).find('Reel').each(function(){
        if($(this).find('Material').text() == _selMatName){
          $(this).find('Material').text($('#matNameInput').val());
        }
      });
    });

    SaveMMSData();
  }

  var found = false;
  $(_matData).find('Material').each(function(){
    if($(this).find('Name').text() == _selMatName){
      found = true;          
      switch(prop){
        case 'Name':
          $(this).find('Name').text($('#matNameInput').val());
           _selMatName = $('#matNameInput').val();
          SortMaterials();
          break;
        case 'SpecificGravity':
          $('#sgInput').val($('#sgInput').val().replace(/_/g, " "));
          if($('#sgInput').val() == ''){
            $('#sgInput').val($(this).find('SpecificGravity').text());
            return;
          }
          $(this).find('SpecificGravity').text(parseFloat($('#sgInput').val()));
          _selMatDen = parseFloat($('#sgInput').val())*1000.0;
          $(this).find('Density').text(_selMatDen);
          $('#denInput').val(GetDimensionDisplayString('Density', _selMatDen));
          break;
        case 'Density':
          $('#denInput').val($('#denInput').val().replace(/_/g, " "));
          if($('#denInput').val() == ''){
            $('#denInput').val($(this).find('Density').text());
            return;
          }
          _selMatDen = GetSciUnitValue('Density', $('#denInput').val());
          $(this).find('Density').text(_selMatDen);
          _selMatSG = (_selMatDen/1000.0).toFixed(2);
          $(this).find('SpecificGravity').text(_selMatSG);
          $('#sgInput').val(_selMatSG);
          $('#denInput').val(GetDimensionDisplayString('Density', _selMatDen)); 
          break;
        default:
          console.log('unrecognized property???');
      }
    }
  });

  //material removed or renamed by other user since last matData.xml GET...
  if(!found){
    console.log('material[' + _selMatName + '] not found! creating new material...');
    _selMatName = $('#matNameInput').val().replace(/_/g, " ");
    AddMaterialName(_selMatName);
    //SetMaterialProperty('SpecificGravity');
    //SetMaterialProperty('Density');
    return false;
  }
  else{
    //update mms with new reel dens if necessary
    $(_mmsData).find('MMS').each(function(){
      $(this).find('Reel').each(function(){
        if($(this).find('Material').text() == _selMatName){
          var mmsID = $(this).parent().attr('ID');
          var reelSlot = $(this).attr('slot');
          MessageMMS(mmsID, mmsID + '_' + reelSlot + '_SetDensity_' + (_selMatDen / 1000.0));
        }
      });
    });

    //SaveMMSData();
  }

  console.log('SetMaterialProperty(' + prop + ') calling SaveMaterialData() ' + $('#matNameInput').val());
  SaveMaterialData();
}

function RemoveMaterialNum(num){
  window.event.stopPropagation();
  if(!confirm('delete material?')){
    return;
  }
  SelectMaterial(num);
  RemoveSelectedMaterial();
}

function RemoveSelectedMaterial(){
  if(_selMatName == null){
    return false;
  }

  console.log('removing material: ' + _selMatName);

  if($('#matDropDown').is(':visible')){
    ToggleMaterialDropDown();
  }

  var found = false;
  $(_mmsData).find('MMS').each(function(){
    $(this).find('Reel').each(function(){
      if($(this).find('SetMaterial').text() == _selMatName){
        $(this).find('SetMaeterial').text('');
        found = true;
      }
    });
  });

  if(found){
    SaveMMSData();
  }

  found = false;
  $(_matData).find('Material').each(function(){
    if($(this).find('Name').text() == _selMatName){
      found = true;
      $(this).remove();
      _selMatName = null;
      _selMatSG = 0;
      _selMatDen = 0;

      $('#matNameInput').val(_selMatName);
      $('#sgInput').val(null);
      $('#denInput').val(null);

      SaveMaterialData();          
    }
  });

  if(!found){
    console.log('selected material not found in materialData???');
  }
}

//POST client unit data to server...
function SaveUnitData(){
  $.post('/unitDataUpdate',
    {xml:(new XMLSerializer().serializeToString(_unitData))},
    function(req, res){console.log('UNIT POST SUCCESS!');},
    'text'
  );
}

//POST client mat data to server...
function SaveMaterialData(){
  $.post('/matDataUpdate',
    {xml:(new XMLSerializer().serializeToString(_matData))},
    function(req, res){console.log('MAT POST success!');},
    'text'
  );
}

//POST client reel data to server...
function SaveReelData(){
  $.post('/reelDataUpdate',
    {xml:(new XMLSerializer().serializeToString(_reelData))},
    function(req, res){console.log('REEL POST success!');},
    'text'
  );
}

//POST client mmsData to server...
function SaveMMSData(){
  $.post('/mmsDataUpdate',
    {xml:(new XMLSerializer().serializeToString(_mmsData))},
    function(req, res){
      console.log('MMS POST success!'); 
      UpdateMMSDataDisplay();
    },
    'text'
  );
}

function RefreshMaterialData(){
  $('#matDropDownBtns').empty();
  $.get('matData.xml', function(matData){
    //foreach material...
    var butNum = 0;
    $(matData).find('Material').each(function(){
      $('#matDropDownBtns').append("<div class='div-btn' id='matButton_" + butNum + "' onclick='SelectMaterial(" + butNum + ")'>" + $(this).find('Name').text()+ " | <button class='btnbtn' onclick='RemoveMaterialNum(" + butNum + ")'>-</button></div>");
      butNum++;
    });

    //store mat data for later...
    _matData = matData;
  });
}

function RefreshReelMaterialData(id){
  var segs = id.split('_');
  $('#' + id).empty();
  $.get('matData.xml', function(matData){
    console.log(id);
    var loadedMat;
    $(_mmsData).find('MMS[ID=' + segs[0] + ']').each(function(){
      $(this).find('Reel[slot=' + segs[2] + ']').each(function(){loadedMat = $(this).find('Material').text();});
    });
    console.log('loadedMat == ' + loadedMat);

    //foreach material...
    var butNum = 0;
    $(matData).find('Material').each(function(){
      $('#' + id).append("<button id='" + id + "_matButton_" + butNum + "'" + 
        ((loadedMat == $(this).find('Name').text()) ? "" : "style='color:red'") + " onclick='SelectReelMaterial(" + 
        '"' + id + '",' + butNum +"); ToggleReelMaterialDropDown(" + '"' + id + '"' + ");'>" + 
        $(this).find('Name').text()+"</button>");
      butNum++;
    });

    //store mat data for later...
    _matData = matData;
  });
}

function RefreshReelWeightData(id){
  var segs = id.split('_');
  var reelWeight = $(_mmsData).find('MMS[ID=' + segs[0] + ']').find('Reel[slot=' + segs[2] + 
    ']').find('LoadedReelWeight').text();

  console.log('reelWeight == ' + reelWeight);

  $('#' + id).empty();
  $('#' + id).append("<p>Loaded Reel Weights :</p><p><input id='" + id + "_newReelInput' type='text' " + 
    "onfocusout='AddReelType(" + '"' + id + '"' + ")' " + "placeholder='new loaded weight(" + 
    $(_unitData).find('Weight').text() + ")...'></p>");
  $.get('reelData.xml', function(reelData){
    //foreach reel type...
    var butNum = 0;
    $(reelData).find('Reel').each(function(){
      var butWeight = $(this).find('LoadedWeight').text();
      console.log('butWeight == ' + butWeight);
      $('#' + id).append("<div class='div-btn' onclick='SelectReelWeight(" + '"' + id + '",' + butNum + 
        "); ToggleBasicDropdown(" + '"' + id + '"' + ");'" + 
        ((Number(butWeight) != Number(reelWeight))? "style='color:red'" : "") + "'>" + 
        GetDimensionDisplayString('Weight', butWeight) + " | <button " + 
        "class='btnbtn' onclick='RemoveReelType(" + '"' + id + '",' + butNum + ")'>-</button>");
      butNum++;
    });

    //store mat data for later...
    _reelData = reelData;
  });
}

function RefreshNozzleDiameterData(id){
  var segs = id.split('_');

  var nozDia = $(_mmsData).find('MMS[ID=' + segs[0] + ']').find('Nozzle[num=' + segs[2] +
      ']').find('Diameter').text();
  //console.log('nozDia == ' + nozDia);

  $('#' + id).find(':button').each(function(){
    var text = $(this).text();
    var butDia = text.substring(0, text.length - 3);
    //console.log('butDia == ' + butDia);
    if(Number(butDia) != Number(nozDia)){
      $(this).css('color', 'red');
    }
    else{
      $(this).css('color', 'white');
    }
  });
}

function RefreshMaterialDiameterData(id){
  var segs = id.split('_');

  var matDia = $(_mmsData).find('MMS[ID=' + segs[0] + ']').find('Nozzle[num=' + segs[2] +
      ']').find('MaterialDiameter').text();
  //console.log('nozDia == ' + nozDia);

  $('#' + id).find(':button').each(function(){
    var text = $(this).text();
    var butDia = text.substring(0, text.length - 3);
    console.log('butDia == ' + butDia);
    if(Number(butDia) != Number(matDia)){
      $(this).css('color', 'red');
    }
    else{
      $(this).css('color', 'white');
    }
  });
}

function RefreshReelExtruderData(id){
  var segs = id.split('_');
  var reelExt = $(_mmsData).find('MMS[ID=' + segs[0] + ']').find('Reel[slot=' + segs[2] + 
    ']').find('ExtNum').text();

  $('#' + id).find(':button').each(function(){
    var butExt = $(this).text();
    if(butExt[0] == '#'){
      butExt = butExt[1];
    }
    else{
      butExt = '';
    }    

    if(Number(butExt) != Number(reelExt)){
      $(this).css('color', 'red');
    }
    else{
      $(this).css('color', 'white');
    }
  });
}

function RefreshReelDiameterData(id){
  var segs = id.split('_');
  var reelDia = $(_mmsData).find('MMS[ID=' + segs[0] + ']').find('Reel[slot=' + segs[2] + 
    ']').find('MaterialDiameter').text();

  $('#' + id).find(':button').each(function(){
    var butDia = $(this).text();
    butDia = butDia.substring(0, butDia.length - 3);
    if(Number(butDia) != Number(reelDia)){
      $(this).css('color', 'red');
    }
    else{
      $(this).css('color', 'white');
    }
  });
}

function ToggleMaterialDropDown(){
  if(!$('#matDropDown').is(':visible')){
    RefreshMaterialData();
  }
  //document.getElementById('matDropDown').classList.toggle('show');
  ToggleBasicDropdown('matDropDown');
}

function ToggleReelMaterialDropDown(id){
  if(!$('#' + id).is(':visible')){
    RefreshReelMaterialData(id);
  }
  //document.getElementById(id).classList.toggle('show');
  ToggleBasicDropdown(id);
}

function ToggleNozzleDiameterDropdown(id){
  if(!$('#' + id).is(':visible')){
    RefreshNozzleDiameterData(id);
  }
  //document.getElementById(id).classList.toggle('show');
  ToggleBasicDropdown(id);
}

function ToggleMaterialDiameterDropdown(id){
  if(!$('#' + id).is(':visible')){
    RefreshMaterialDiameterData(id);
  }
  
  //document.getElementById(id).classList.toggle('show');
  ToggleBasicDropdown(id);
}

function ToggleReelExtruderDropDown(id){
  if(!$('#' + id).is(':visible')){
    RefreshReelExtruderData(id);
  }
  ToggleBasicDropdown(id);
}

function ToggleReelDiameterDropdown(id){
  if(!$('#' + id).is(':visible')){
    RefreshReelDiameterData(id);
  }
  ToggleBasicDropdown(id);
}

function ToggleBasicDropdown(id){
  HideOtherDropDowns(id);
  document.getElementById(id).classList.toggle('show');
}

function HideOtherDropDowns(id){
  //console.log(id);
  $(".dropdown-content.show").each(function(index){
    //console.log(index + ": " + this.id);
    if(!(this.id == id)){
      document.getElementById(this.id).classList.toggle('show');      
      //console.log("should hide!");
    }
  });
}

function ToggleReelWeightDropDown(id){
  if(!$('#' + id).is(':visible')){
    RefreshReelWeightData(id);
  }
  //document.getElementById(id).classList.toggle('show');
  ToggleBasicDropdown(id);
}

//for estimating remaining filament...
function GetMaterialDensity(name){
  var mats = $(_matData).find('Material');
  for(var i = 0; i < mats.length; i++){
    if($(mats[i]).find('Name').text() == name){
      return Number($(mats[i]).find('Density').text());
    }
  }      
  return 0;
}

function RemoveMMSUnit(id){
  //window.event.stopPropagation();
  if(!confirm('delete MMS unit?')){
    return;
  }

  $(_mmsData).find('MMS').each(function(){
    if($(this).attr('ID') == id){
      console.log('found mms: ' + id);
      $(this).remove();
    }
  });
  SaveMMSData();
  location.reload();
}

function ConstructMMSDataDisplay(){
  $.get('/mmsDataUpdate', function(mmsData){
    _mmsData = $.parseXML(mmsData);

    //for each unit
    $(_mmsData).find('MMS').each(function(){
      var MMSDivID = $(this).attr('ID') + '_div';
      $('#mmsDataDiv').append("<div id='" + MMSDivID + "' class='mmsUnitDiv'><div id='" + MMSDivID +
        "_conDiv' class='dashConDiv'><b>DISCONNECTED</b><br/><button class='mmsDelBtn' onclick='RemoveMMSUnit(" +
        '"' + $(this).attr('ID') + '"' + ")'>Delete</button></div></div>"); 

      //label, display, and populate, unit name field...
      var MMSname = $(this).find('Name').text();
      var nameFieldID = $(this).attr('ID') + '_nameField';
      var humidityFieldID = $(this).attr('ID') + '_humidityField';
      var tempFieldID = $(this).attr('ID') + '_tempField';

      $('#mmsDataDiv').find('#' + MMSDivID).append("<div style='width: 65%; display: inline-block; padding-top: " +
        "10px; padding-bottom: 10px'>" + "<b>Unit Name:</b> <input type='text' id='" + nameFieldID + "' value='" + 
        MMSname + "' onfocusin='PauseMMSDisplayNameFieldUpdate()' onfocusout='ChangeUnitName(" + '"' + nameFieldID +
        '"' + "); PauseMMSDisplayNameFieldUpdate();' maxlength='15'/></div><div style='width: 30%; " + 
        "display: inline-block; " + 
        "text-align: right; padding-right: 10px;'> RH : <b><span id='" + humidityFieldID + 
        "'>" + $(this).find('RHP').text() + "%</span></b><br>Temp : <b><span id='" + tempFieldID +
        "'>" + GetDimensionDisplayString('Temperature', $(this).find('TempC').text()) + "</span></b></div>");

      //foreach nozzle in MMS...
      $(this).find('Nozzle').each(function(){
        var nozzleName = 'Nozzle_' + $(this).attr('num');
        var nozzleID = MMSDivID.split('_')[0] + "_" + nozzleName;

        var nozzleDia = $(this).find('SetDiameter').text();
        var diaMatch = (Number(nozzleDia) == Number($(this).find('Diameter').text()));
        var matDia = $(this).find('SetMaterialDiameter').text();
        var matDiaMatch = (Number(matDia) == Number($(this).find('MaterialDiameter').text()));
        var highTemp = $(this).find('SetHighTemp').text();
        var highTempMatch = (highTemp == $(this).find('HighTemp').text());
        var antiAbrasion = $(this).find('SetAntiAbrasion').text();
        var aaMatch = (antiAbrasion == $(this).find('AntiAbrasion').text());
        var spfu = $(this).find('SetSPFU').text();
        var spfuMatch = (spfu == $(this).find('SPFU').text());

        $('#mmsDataDiv').find('#' + MMSDivID).append("<div id='" + nozzleID + "_div'><b>" + nozzleName +
          "</b></br><div class='dropdown'><button onclick='" + "ToggleNozzleDiameterDropdown(" + '"' +
          nozzleID + "_nozzleDiameterDropdown" + '"' + ")'>Nozzle Diameter</button><div id='" + nozzleID +
          "_nozzleDiameterDropdown' " +
          "class='dropdown-content'><button onclick='SetNozzleDiameter(" + '"' + nozzleID + '"' +
          ", 0.2); ToggleBasicDropdown(" + '"' + nozzleID + "_nozzleDiameterDropdown" + '"' +
          ");'>0.2 mm</button><button onclick='SetNozzleDiameter(" + '"' + nozzleID + '"' +
          ", 0.3); ToggleBasicDropdown(" + '"' + nozzleID + "_nozzleDiameterDropdown" + '"' +
          ");'>0.3 mm</button><button onclick='SetNozzleDiameter(" + '"' + nozzleID + '"' +
          ", 0.4); ToggleBasicDropdown(" + '"' + nozzleID + "_nozzleDiameterDropdown" + '"' +
          ");'>0.4 mm</button>" + "<button onclick='SetNozzleDiameter(" + '"' + nozzleID + '"' +
          ", 0.6); ToggleBasicDropdown(" + '"' + nozzleID + "_nozzleDiameterDropdown" + '"' +
          ");'>0.6 mm</button><button onclick='SetNozzleDiameter(" + '"' + nozzleID + '"' +
          ", 0.8); ToggleBasicDropdown(" + '"' + nozzleID + "_nozzleDiameterDropdown" + '"' +
          ");'>0.8 mm</button></div></div> <b>: <span id='" + nozzleID + 
          "_diaLabCol'" + ((diaMatch) ? "":" style='color:red'") + "><span id='" + 
          nozzleID + "_diaLab'>" + nozzleDia + "</span> mm</span> | " + 
          "<div class='dropdown'><button onclick='" + "ToggleMaterialDiameterDropdown(" + '"' +
          nozzleID + "_matDiameterDropdown" + '"' + ")'>Material Diameter</button><div id='" + nozzleID +
          "_matDiameterDropdown' " +
          "class='dropdown-content'><button onclick='SetMaterialDiameter(" + '"' + nozzleID + '"' +
          ", 1.75); ToggleBasicDropdown(" + '"' + nozzleID + "_matDiameterDropdown" + '"' +
          ");'>1.75 mm</button><button onclick='SetMaterialDiameter(" + '"' + nozzleID + '"' +
          ", 2.85); ToggleBasicDropdown(" + '"' + nozzleID + "_matDiameterDropdown" + '"' +
          ");'>2.85 mm</button></div></div> <b>: <span id='" + nozzleID +
          "_matDiaLabCol'" + ((matDiaMatch) ? "":" style='color:red'") + "><span id='" +
          nozzleID + "_matDiaLab'>" + matDia + "</span> mm</span><br><input type='checkbox' id='" + nozzleID + 
          "_ht' onchange='SetNozzleHighTemp(" + '"' + nozzleID + '"' + ")'" + 
          ((highTemp == "true")? " checked='on'":"") + "'><span id ='" + nozzleID + "_htLabCol' " + 
          ((highTempMatch) ? "":" style='color:red'") + ">High Temp</span> <input type='checkbox' id='" +
          nozzleID + "_aa' onchange='SetNozzleAntiAbrasion(" + '"' + nozzleID + '"' + ")'" + 
          ((antiAbrasion == "true")? " checked='on'":"") + "><span id ='" + nozzleID + "_aaLabCol' " +
          ((aaMatch) ? "":" style='color:red'") + ">Anti-Abrasion</span></b><input type='checkbox' id='" +
          nozzleID + "_spfu' onchange='SetNozzleSPFU(" + '"' + nozzleID + '"' + ")'" +
          ((spfu == "true")? " checked='on'":"") + "><span id ='" + nozzleID + "_spfuLabCol' " +
          ((spfuMatch) ? "":" style='color:red'") + ">SPFU</span></b></div></div><br>");
      });

      //foreach reel in MMS...
      $(this).find('Reel').each(function(){
        var reelName = 'Reel_' + $(this).attr('slot');
        var reelID = /*_mmsDisplayDiv.substr(1) + '_' +*/ MMSDivID.split('_')[0] + '_' + reelName;
        var reelMatDropdownID = reelID + '_matDropdown';
        var reelDiaDropdownID = reelID + '_diaDropdown';
        var reelWeightDropdownID = reelID + '_reelWeightDropdown';
        var reelExtDropdownID = reelID + '_reelExtDropdown';

        var reelSelMat = $(this).find('SetMaterial').text();
        var selMatLoaded = (reelSelMat == $(this).find('Material').text());
        if(reelSelMat == ''){
          reelSelMat = 'Select Material...';
        }

        var reelDia = $(this).find('SetMaterialDiameter').text();
        var selDiaLoaded = (Number(reelDia) == Number($(this).find('MaterialDiameter').text()));
        if(reelDia == ''){
          reelDia = 'Select/Set Material Diameter...';
        }

        var reelExt = $(this).find('SetExtNum').text();
        var selExtLoaded = (Number(reelExt) == Number($(this).find('ExtNum').text()));
        if(reelExt == '0'){
          reelExt = 'not fed...';
        }
        else{
          reelExt = '#' + reelExt;
        }

        var emptyReelWeight = $(this).find('SetLoadedReelWeight').attr('emptyWeight');
        if(emptyReelWeight == ''){
          emptyReelWeight = 'enter weight';
        }

        var liveReelWeight = $(this).find('LiveWeight').text();
        //var liveReelWeight = Number("1947.6");
        //var liveReelWeight = '0.0';
        if(liveReelWeight == ''){
          console.log('error in mmsData.xml!');
        }

        var loadedReelWeight = $(this).find('SetLoadedReelWeight').text();
        var selLRWLoaded = (Number(loadedReelWeight) == Number($(this).find('LoadedReelWeight').text()));
        if(loadedReelWeight == ''){
          selLRWLoaded = 'not selected';
          emptyReelWeight = 'select reel weight';
        }

        //var matVolume = (Number(liveReelWeight) - Number(emptyReelWeight)) / GetMaterialDensity(reelSelMat);
        var matVolume = Number(liveReelWeight) / GetMaterialDensity(reelSelMat);
        var rSquared = (Number(reelDia) * 0.5) * 0.001; //assumes mm input
        rSquared *= rSquared;
        var remFilament = (matVolume / (_PI * rSquared)).toFixed(2);

        remFilament = (Number(liveReelWeight) > 0.0) ? remFilament : 'reel empty';
        remFilament = (emptyReelWeight != 'enter weight') ? GetDimensionDisplayString('Length', remFilament) : 'enter/select empty reel weight...';
        remFilament = (reelSelMat != 'Select Material...') ? remFilament : 'Select Material...';
        //remFilament = (Number(liveReelWeight) > Number(emptyReelWeight)) ? remFilament : 'reel empty';
        emptyReelWeight = GetDimensionDisplayString('Weight', emptyReelWeight);
        liveReelWeight = GetDimensionDisplayString('Weight', liveReelWeight);
        reelDia = GetDimensionDisplayString('MaterialDiameter', reelDia);
        //var loadedReelWeight = GetDimensionDisplayString('Weight', $(this).find('SetLoadedReelWeight').text());
        loadedReelWeight = GetDimensionDisplayString('Weight', loadedReelWeight);

        $('#mmsDataDiv').find('#' + MMSDivID).append("<div id='" + MMSDivID.split('_')[0] + "_" +
          reelName + "_div'><p><div class='dropdown'><b>" + reelName +
          " |</b> <div class='dropdown'><button onclick='ToggleReelExtruderDropDown(" + '"' + 
          reelExtDropdownID + '"' +
          ")'>Extruder</button> <b>: <span id='" + reelID + "_extLab' " + 
          ((selExtLoaded)?"":"style='color:red'") + ">" + reelExt + "</span></b><div id='" + 
          reelExtDropdownID + "' class='dropdown-content'><button onclick='SetReelExtruder(" + '"' + 
          reelExtDropdownID + '"' +
          ", 1); ToggleBasicDropdown(" + '"' + reelExtDropdownID + '"' +
          ");'>#1</button><button onclick='SetReelExtruder(" + '"' + reelExtDropdownID + '"' +
          ", 2); ToggleBasicDropdown(" + '"' + reelExtDropdownID + '"' +
          ");'>#2</button><button onclick='SetReelExtruder(" + '"' + reelExtDropdownID + '"' +
          ", 3); ToggleBasicDropdown(" + '"' + reelExtDropdownID + '"' +
          ");'>#3</button><button onclick='SetReelExtruder(" + '"' + reelExtDropdownID + '"' +
          ", 0); ToggleBasicDropdown(" + '"' + reelExtDropdownID + '"' +
          ");'>not fed</button></div></div></p>" +
          "<div class='dropdown'><button onclick='ToggleReelMaterialDropDown(" + '"' +
          reelMatDropdownID + '"' + ")'>Material</button> <b>: <span id='" + reelMatDropdownID +
          "_matLab'" + ((selMatLoaded)?"":"style='color:red'") + ">" + reelSelMat + "</span></b><div id='" + 
          reelMatDropdownID + "' class='dropdown-content'><div id='" + reelMatDropdownID + 
          "_btns'></div></div></div> | " + "<div class='dropdown'><button onclick='ToggleReelDiameterDropdown(" + 
          '"' + reelDiaDropdownID + '"' + ")'>Diameter</button> <b>: <span id='" + reelDiaDropdownID +
          "_diaLab' " + ((selDiaLoaded)?"":"style='color:red'") + ">" + reelDia + "</span></b><div id = '" + 
          reelDiaDropdownID +
          "' class='dropdown-content'><p><input id ='" + reelDiaDropdownID + "_input' type='text' " +
          "placeholder='material diameter(" + $(_unitData).find('MaterialDiameter').text() + ")...' " +
          "onfocusout='SetReelDiameter(" + '"' + reelDiaDropdownID + '"' + ");ToggleReelDiameterDropdown(" +
          '"' + reelDiaDropdownID + '"' + ");' maxlength='15'></p><button onclick='SetReelDiameter(" + '"' + 
          reelDiaDropdownID + '"' +
          ", 1.75); ToggleBasicDropdown(" + '"' + reelDiaDropdownID +
          '"' + ");'>" + GetDimensionDisplayString('MaterialDiameter', 1.75) + "</button><button " +
          "onclick='SetReelDiameter(" + '"' + reelDiaDropdownID + '"' + ", 2.85); ToggleBasicDropdown(" + 
          '"' + reelDiaDropdownID + '"' + ");'>" +
          GetDimensionDisplayString('MaterialDiameter', 2.85) + "</button></div></div></p><p><div " +
          "class='dropdown'><button onclick='" + "ToggleReelWeightDropDown(" + '"' + reelWeightDropdownID +
          '"' + ")'>Reel Weight</button> " + "<b>: <span id='" + reelID + "_loadedWeightLab' " + 
          ((selLRWLoaded)?"":"style='color:red'") + ">" + loadedReelWeight + 
          "</span> :</b> <input id='" + reelWeightDropdownID + "_emptyWeightInput' type='text' onfocusout='" + 
          "UpdateReelWeight(" + '"' + reelWeightDropdownID + '"' + ")' placeholder='" + emptyReelWeight + 
          " (empty reel weight)' maxlength='15'>" + "<div id='" + reelWeightDropdownID + 
          "' class='dropdown-content'>" + 
          "</div></div></p><p><b>Live Weight : <span id='" + reelID + "_liveWeightLab'>" + liveReelWeight + 
          "</span></b></p><p><b>Remaining Filament : <span id ='" + reelID + "_remFilLab'>" + 
          remFilament + "</span></b></p></div>");
      });
      $(_mmsDisplayDiv).find('#' + MMSDivID).append('<br/><br/><br/>');

      _mmsDisplayInterval = setInterval(UpdateMMSDataDisplay, 1000);
    });    
  });
}

function UpdateMMSDataDisplay(){
  $.get('/mmsDataUpdate', function(mmsData){
    _mmsData = $.parseXML(mmsData);

    var curUnitCount = $('#mmsDataDiv').children().length;
    var newUnitCount = $(_mmsData).find('MMS').length;

    //console.log('curUnitCount == ' + curUnitCount);
    //console.log('newUnitCount == ' + newUnitCount);

    if(curUnitCount != newUnitCount){
      //console.log('need to reload!');
      //console.log('curUnitCount == ' + curUnitCount);
      //console.log('newUnitCount == ' + newUnitCount);
      return location.reload();
    }

    //for each unit
    $(_mmsData).find('MMS').each(function(){
      var MMSDivID = $(this).attr('ID') + '_div';

      var connected = $(this).find('Connected').text();
      if(connected == 'false' && !$('#' + MMSDivID + '_conDiv').is(':visible')){
        console.log('unit not connected [' + MMSDivID + ']');
        document.getElementById(MMSDivID + '_conDiv').classList.toggle('show');
      }
      else if(connected == 'true' && $('#' + MMSDivID + '_conDiv').is(':visible')){
        console.log('unit connected [' + MMSDivID + ']');
        document.getElementById(MMSDivID + '_conDiv').classList.toggle('show');
      }
      
      //update, unit name field...
      if(!_mmsDisplayNameFieldUpdatePaused){
        var MMSname = $(this).find('Name').text();
        var nameFieldID = $(this).attr('ID') + '_nameField';
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nameFieldID).val(MMSname);
      }

      var humidityFieldID = $(this).attr('ID') + '_humidityField';
      var MMSHumidity = $(this).find('RHP').text() + '%';
      $('#mmsDataDiv').find('#' + MMSDivID).find('#' + humidityFieldID).text(MMSHumidity);

      var tempFieldID = $(this).attr('ID') + '_tempField';
      var MMSTemp = GetDimensionDisplayString('Temperature', $(this).find('TempC').text());
      $('#mmsDataDiv').find('#' + MMSDivID).find('#' + tempFieldID).text(MMSTemp);

      //foreach nozzle in MMS...
      $(this).find('Nozzle').each(function(){
        var nozzleName = 'Nozzle_' + $(this).attr('num');
        var nozzleID = MMSDivID.split('_')[0] + "_" + nozzleName;

        var nozzleDia = $(this).find('SetDiameter').text();
        var diaMatch = (Number(nozzleDia) == Number($(this).find('Diameter').text()));
        var matDia = $(this).find('SetMaterialDiameter').text();
        var matDiaMatch = (Number(matDia) == Number($(this).find('MaterialDiameter').text()));
        var highTemp = $(this).find('SetHighTemp').text();
        var highTempMatch = (highTemp == $(this).find('HighTemp').text());
        var antiAbrasion = $(this).find('SetAntiAbrasion').text();
        var aaMatch = (antiAbrasion == $(this).find('AntiAbrasion').text());
        var spfu = $(this).find('SetSPFU').text();
        var spfuMatch = (spfu == $(this).find('SPFU').text());

        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID + '_diaLab').text(nozzleDia);
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID + 
          '_diaLabCol').css('color', (diaMatch) ? 'black' : 'red');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID + '_matDiaLab').text(matDia);
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID +
          '_matDiaLabCol').css('color', (matDiaMatch) ? 'black' : 'red');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID + '_ht').prop('checked', highTemp == 'true');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID + 
          '_htLabCol').css('color', (highTempMatch) ? 'black' : 'red');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID + '_aa').prop('checked', antiAbrasion == 'true');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID +
          '_aaLabCol').css('color', (aaMatch) ? 'black' : 'red');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID + '_spfu').prop('checked', spfu == 'true');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + nozzleID +
          '_spfuLabCol').css('color', (spfuMatch) ? 'black' : 'red');
      });

      //foreach reel in MMS...
      $(this).find('Reel').each(function(){
        var reelName = 'Reel_' + $(this).attr('slot');
        var reelID = /*_mmsDisplayDiv.substr(1) + '_' +*/ MMSDivID.split('_')[0] + '_' + reelName;
        var reelMatDropdownID = reelID + '_matDropdown';
        var reelDiaDropdownID = reelID + '_diaDropdown';
        var reelWeightDropdownID = reelID + '_reelWeightDropdown';
        var reelExtDropdownID = reelID + '_reelExtDropdown';

        var reelSelMat = $(this).find('SetMaterial').text();
        var selMatLoaded = (reelSelMat == $(this).find('Material').text());
        if(reelSelMat == ''){
          reelSelMat = 'Select Material...';
        }

        var reelDia = $(this).find('SetMaterialDiameter').text();
        var selDiaLoaded = (Number(reelDia) == Number($(this).find('MaterialDiameter').text()));
        if(reelDia == ''){
          reelDia = 'Select/Set Material Diameter...';
        }

        var reelExt = $(this).find('SetExtNum').text();
        var selExtLoaded = (Number(reelExt) == Number($(this).find('ExtNum').text()));
        if(reelExt == '0'){
          reelExt = 'not fed...';
        }
        else{
          reelExt = '#' + reelExt;
        }

        var emptyReelWeight = $(this).find('SetLoadedReelWeight').attr('emptyWeight');
        if(emptyReelWeight == ''){
          emptyReelWeight = 'enter weight';
        }

        var liveReelWeight = $(this).find('LiveWeight').text();
        //var liveReelWeight = '01110.00';
        if(liveReelWeight == ''){
          console.log('error in mmsData.xml!');
        }

        var loadedReelWeight = $(this).find('SetLoadedReelWeight').text();
        var selLRWLoaded = (Number(loadedReelWeight) == Number($(this).find('LoadedReelWeight').text()));
        if(loadedReelWeight == ''){
          loadedReelWeight = 'not selected';
          emptyReelWeight = 'select reel weight';
        }

        //var matVolume = (Number(liveReelWeight) - Number(emptyReelWeight)) / GetMaterialDensity(reelSelMat);
        var matVolume = Number(liveReelWeight) / GetMaterialDensity(reelSelMat);
        var rSquared = (Number(reelDia) * 0.5) * 0.001; //assumes mm input
        rSquared *= rSquared;
        var remFilament = (matVolume / (_PI * rSquared)).toFixed(2);

        remFilament = (Number(liveReelWeight) > 0.0) ? remFilament : 'reel empty';
        remFilament = (emptyReelWeight != 'enter weight') ? GetDimensionDisplayString('Length', remFilament) : 'enter/select empty reel weight...';
        remFilament = (reelSelMat != 'Select Material...') ? remFilament : 'Select Material...';
        //remFilament = (Number(liveReelWeight) > Number(emptyReelWeight)) ? remFilament : 'reel empty';
        emptyReelWeight = GetDimensionDisplayString('Weight', emptyReelWeight);
        liveReelWeight = GetDimensionDisplayString('Weight', liveReelWeight);
        reelDia = GetDimensionDisplayString('MaterialDiameter', reelDia);
        var loadedReelWeight = GetDimensionDisplayString('Weight', $(this).find('SetLoadedReelWeight').text());

        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelID + '_extLab').text(reelExt);
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelID + 
          '_extLab').css('color', (selExtLoaded) ? 'black' : 'red');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelMatDropdownID + '_matLab').text(reelSelMat);
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelMatDropdownID + 
          '_matLab').css('color', (selMatLoaded) ? 'black' : 'red');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelDiaDropdownID + '_diaLab').text(reelDia);
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelDiaDropdownID +
          '_diaLab').css('color', (selDiaLoaded) ? 'black' : 'red');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelID + '_loadedWeightLab').text(loadedReelWeight);
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelID +
          '_loadedWeightLab').css('color', (selLRWLoaded) ? 'black' : 'red');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelWeightDropdownID + 
          '_emptyWeightInput').attr('placeholder', emptyReelWeight + ' (empty reel weight)');
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelID + '_liveWeightLab').text(liveReelWeight);
        $('#mmsDataDiv').find('#' + MMSDivID).find('#' + reelID + '_remFilLab').text(remFilament);
      });
    });
  });
}

function ConstructMMSSummaryDisplay(){
  //do stuff with MMS data...
  $.get('/mmsDataUpdate', function(mmsData){
    _mmsData = $.parseXML(mmsData);

    //foreach MMS Unit...
    $(_mmsData).find('MMS').each(function(){
      var MMSDivID = $(this).attr('ID') + '_div';
      //var connected = $(this).find('Connected').text();
      $('#mmsDataSumDiv').append("<div id='" + MMSDivID + "' class='mmsUnitSumDiv'><div id='" + MMSDivID + 
        "_conDiv' class='sumConDiv'><b>DISCONNECTED</b></div></div>"); //ToggleBasicDropdown(id) to show/hide

      //label, display, and populate, unit name field...
      var MMSname = $(this).find('Name').text();
      var nameFieldID = $(this).attr('ID') + '_nameField';
      var humidityFieldID = $(this).attr('ID') + '_humidityField';
      var tempFieldID = $(this).attr('ID') + '_tempField';
      $('#mmsDataSumDiv').find('#'+MMSDivID).append("<div id ='" + nameFieldID + 
        "_div' class='mmsUnitSumNameDiv'><div style='width: 50%; display:inline-block;'>Unit Name : <b><span id='" + 
        nameFieldID + "'>" + MMSname + "</span></b></div><div style='width: 50%; display:inline-block; " + 
        "text-align: right;'> RH : <b><span id='" + humidityFieldID + "'>" + 
        $(this).find('RHP').text() + "%</span></b> | Temp : <b><span id='" + tempFieldID + "'>" +
        GetDimensionDisplayString('Temperature', $(this).find('TempC').text()) + "</span></b></div></div>");

      //foreach nozzle in MMS...
      $(this).find('Nozzle').each(function(){
        var nozzleName = 'Nozzle_' + $(this).attr('num');
        var nozzleID = MMSDivID.split('_')[0] + "_" + nozzleName;
        var nozzle = MMSDivID.split('_')[0] + "_" + nozzleName;

        var nozzleDia = $(this).find('SetDiameter').text();
        var diaMatch = (Number(nozzleDia) == Number($(this).find('Diameter').text()));
        var matDia = $(this).find('SetMaterialDiameter').text();
        var matDiaMatch = (Number(matDia) == Number($(this).find('MaterialDiameter').text()));
        var highTemp = $(this).find('SetHighTemp').text();
        var highTempMatch = (highTemp == $(this).find('HighTemp').text());
        var antiAbrasion = $(this).find('SetAntiAbrasion').text();
        var aaMatch = (antiAbrasion == $(this).find('AntiAbrasion').text());
        var spfu = $(this).find('SetSPFU').text();
        var spfuMatch = (spfu == $(this).find('SPFU').text());

        //force ht/aa/spfu display 
        if(!highTemp && !highTempMatch){
          highTemp = "true";
        }
        if(!antiAbrasion && !aaMatch){
          antiAbrasion = "true";
        }
        if(!spfu && !spfuMatch){
          spfu = "true";
        }

        $('#mmsDataSumDiv').find('#' + MMSDivID).append("<div id='" + nozzleID + 
          "_div' class='mmsUnitSumNozzleDiv'><b>" + nozzleName +
          "</b><br>Diameter : <b><span id='" + nozzleID + "_diaLabCol'" + ((diaMatch) ? "":" style='color:red'") + 
          "><span id='" + nozzleID + "_diaLab'>" + nozzleDia + 
          "</span> mm</span></b><br>Material Diameter : <b><span id='" + nozzleID + "_matDiaLabCol'" + 
          ((matDiaMatch) ? "":" style='color:red'") + "><span id='" + nozzleID + "_matDiaLab'>" + matDia +
          "</span> mm</span></b><br><b><span id='" + nozzleID + "_htLab'" + 
          ((highTempMatch) ? "":" style='color:red'") + ">" + ((highTemp == "true")? "HT":"") + 
          "</span> <span id='" + nozzleID + 
          "_aaLab'" + ((aaMatch) ? "":" style='color:red'") + ">" + ((antiAbrasion == "true")? "AA":"") + 
          "</span> <span id='" + nozzleID +
          "_spfuLab'" + ((spfuMatch) ? "":" style='color:red'") + ">" + ((spfu == "true")? "SPFU":"") +
          "</span></b></div>");
      });

      //foreach reel in MMS...
      $(this).find('Reel').each(function(){
        var reelName = 'Reel_' + $(this).attr('slot');
        var reelID = MMSDivID.split('_')[0] + '_' + reelName;
        var reelMatDropdownID = reelID + '_matDropdown';
        var reelDiaDropdownID = reelID + '_diaDropdown';
        var reelWeightDropdownID = reelID + '_reelWeightDropdown';

        var reelSelMat = $(this).find('SetMaterial').text();
        var selMatLoaded = (reelSelMat == $(this).find('Material').text());
        if(reelSelMat == ''){
          reelSelMat = 'Select Material...';
        }

        var reelDia = $(this).find('SetMaterialDiameter').text();
        var selDiaLoaded = (Number(reelDia) == Number($(this).find('MaterialDiameter').text()));
        if(reelDia == ''){
          reelDia = 'Select/Set Material Diameter...';
        }

        var reelExt = $(this).find('SetExtNum').text();
        var selExtLoaded = (Number(reelExt) == Number($(this).find('ExtNum').text()));
        if(reelExt == '0'){
          reelExt = 'not fed...';
        }
        else{
          reelExt = '#' + reelExt;
        }

        var emptyReelWeight = $(this).find('SetLoadedReelWeight').attr('emptyWeight');
        if(emptyReelWeight == ''){
          emptyReelWeight = 'enter weight';
        }

        var liveReelWeight = $(this).find('LiveWeight').text();
        if(liveReelWeight == ''){
          console.log('error in mmsData.xml!');
        }

        var loadedReelWeight = $(this).find('SetLoadedReelWeight').text();
        var selLRWLoaded = (Number(loadedReelWeight) == Number($(this).find('LoadedReelWeight').text()));
        if(loadedReelWeight == ''){
          loadedReelWeight = 'not selected';
          emptyReelWeight = 'select reel weight';
        }

        //var matVolume = (Number(liveReelWeight) - Number(emptyReelWeight)) / GetMaterialDensity(reelSelMat);
        var matVolume = Number(liveReelWeight) / GetMaterialDensity(reelSelMat);
        var rSquared = (Number(reelDia) * 0.5) * 0.001; //assumes mm input
        rSquared *= rSquared;
        var remFilament = (matVolume / (_PI * rSquared)).toFixed(2);

        remFilament = (Number(liveReelWeight) > 0.0) ? remFilament : 'reel empty';
        remFilament = (emptyReelWeight != 'enter weight') ? GetDimensionDisplayString('Length', remFilament) : 'enter/select empty reel weight...';
        remFilament = (reelSelMat != 'Select Material...') ? remFilament : 'select Material...';
        //remFilament = (Number(liveReelWeight) > Number(emptyReelWeight)) ? remFilament : 'reel empty';
        emptyReelWeight = GetDimensionDisplayString('Weight', emptyReelWeight);
        liveReelWeight = GetDimensionDisplayString('Weight', liveReelWeight);
        reelDia = GetDimensionDisplayString('MaterialDiameter', reelDia);
        var loadedReelWeight = GetDimensionDisplayString('Weight', $(this).find('SetLoadedReelWeight').text());

        $('#mmsDataSumDiv').find('#' + MMSDivID).append("<div id='" + MMSDivID.split('_')[0] + "_" +
          reelName + "_div' class='mmsUnitSumReelDiv'><p><b>" + reelName + "</b> | Extruder : <b><span id='" + 
          reelID + "_extLab'" + ((selExtLoaded) ? "":" style='color:red'") + ">" + reelExt + 
          "</span></b><br/>Material : <b><span id='" +
          reelMatDropdownID + "_matLab'" + ((selMatLoaded) ? "":" style='color:red'") + ">" + 
          reelSelMat + "</span></b><br/>Diameter : <b><span id='" +
          reelDiaDropdownID + "_diaLab'" + ((selDiaLoaded) ? "":" style='color:red'") + ">" + reelDia + 
          "</span></b><br/>Reel Weight :<b> <span id='" + reelID + 
          "_loadedWeightLab'" + ((selLRWLoaded) ? "":" style='color:red'") + ">" + loadedReelWeight + 
          "</span></b><br/>Live Weight :<b> <span id='" + reelID + 
          "_liveWeightLab'>" + liveReelWeight + "</span></b><br/><b>Remaining Filament : <span id='" + reelID + 
          "_remFilLab'>" + remFilament + "</span></b></p></div>");
      });
    });
  _mmsDisplayInterval = setInterval(UpdateMMSSummaryDisplay, 1000);
  });
}

function UpdateMMSSummaryDisplay(){
  $.get('/mmsDataUpdate', function(mmsData){
    _mmsData = $.parseXML(mmsData);

    var curUnitCount = $('#mmsDataSumDiv').children().length;
    var newUnitCount = $(_mmsData).find('MMS').length;

    //console.log('curUnitCount == ' + curUnitCount);
    //console.log('newUnitCount == ' + newUnitCount);

    if(curUnitCount != newUnitCount){
      //console.log('need to reload!');
      //console.log('curUnitCount == ' + curUnitCount);
      //console.log('newUnitCount == ' + newUnitCount);
      return location.reload();
    }

    //foreach MMS Unit...
    $(_mmsData).find('MMS').each(function(){
      var MMSDivID = $(this).attr('ID') + '_div';

      var connected = $(this).find('Connected').text();
      if(connected == 'false' && !$('#' + MMSDivID + '_conDiv').is(':visible')){
        console.log('unit not connected [' + MMSDivID + ']');
        document.getElementById(MMSDivID + '_conDiv').classList.toggle('show');
      }
      else if(connected == 'true' && $('#' + MMSDivID + '_conDiv').is(':visible')){
        console.log('unit connected [' + MMSDivID + ']');
        document.getElementById(MMSDivID + '_conDiv').classList.toggle('show');
      }
      
      var MMSname = $(this).find('Name').text();      
      var nameFieldID = $(this).attr('ID') + '_nameField';
      $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nameFieldID).text(MMSname);

      var MMSHumidity = $(this).find('RHP').text() + '%';
      var humidityFieldID = $(this).attr('ID') + '_humidityField';
      $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + humidityFieldID).text(MMSHumidity);

      var MMSTemp = GetDimensionDisplayString('Temperature', $(this).find('TempC').text());
      var tempFieldID = $(this).attr('ID') + '_tempField';
      $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + tempFieldID).text(MMSTemp);

      //foreach nozzle in MMS...
      $(this).find('Nozzle').each(function(){
        var nozzleName = 'Nozzle_' + $(this).attr('num');
        var nozzleID = MMSDivID.split('_')[0] + "_" + nozzleName;
        var nozzle = MMSDivID.split('_')[0] + "_" + nozzleName;

        var nozzleDia = $(this).find('SetDiameter').text();
        var diaMatch = (Number(nozzleDia) == Number($(this).find('Diameter').text()));
        var matDia = $(this).find('SetMaterialDiameter').text();
        var matDiaMatch = (Number(matDia) == Number($(this).find('MaterialDiameter').text()));
        var highTemp = $(this).find('SetHighTemp').text();
        var highTempMatch = (highTemp == $(this).find('HighTemp').text());
        var antiAbrasion = $(this).find('SetAntiAbrasion').text();
        var aaMatch = (antiAbrasion == $(this).find('AntiAbrasion').text());
        var spfu = $(this).find('SetSPFU').text();
        var spfuMatch = (spfu == $(this).find('SPFU').text());

        //force ht/aa display
        if(!highTemp && !highTempMatch){
          highTemp = "true";
        }
        if(!antiAbrasion && !aaMatch){
          antiAbrasion == "true";
        }
        if(!spfu && !spfuMatch){
          spfu = "true";
        }

        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID + '_diaLab').text(nozzleDia);
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID +
          '_diaLabCol').css('color', (diaMatch) ? 'black' : 'red');
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID + '_matDiaLab').text(matDia);
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID +
          '_matDiaLabCol').css('color', (matDiaMatch) ? 'black' : 'red');
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID + 
          '_htLab').text(((highTemp == 'true') ? 'HT' : ''));
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID +
          '_htLab').css('color', (highTempMatch) ? 'black' : 'red');
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID + 
          '_aaLab').text(((antiAbrasion == 'true')? 'AA' : ''));
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID +
          '_aaLab').css('color', (aaMatch) ? 'black' : 'red');
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID +
          '_spfuLab').text(((spfu == 'true')? 'SPFU' : ''));
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + nozzleID +
          '_spfuLab').css('color', (spfuMatch) ? 'black' : 'red');
      });

      //foreach reel in MMS...
      $(this).find('Reel').each(function(){
        var reelName = 'Reel_' + $(this).attr('slot');
        var reelID = MMSDivID.split('_')[0] + '_' + reelName;
        var reelMatDropdownID = reelID + '_matDropdown';
        var reelDiaDropdownID = reelID + '_diaDropdown';
        var reelWeightDropdownID = reelID + '_reelWeightDropdown';
        var reelSelMat = $(this).find('SetMaterial').text();
        var selMatLoaded = (reelSelMat == $(this).find('Material').text());
        if(reelSelMat == ''){
          reelSelMat = 'Select Material...';
        }

        var reelDia = $(this).find('SetMaterialDiameter').text();
        var selDiaLoaded = (Number(reelDia) == Number($(this).find('MaterialDiameter').text()));
        if(reelDia == ''){
          reelDia = 'Select/Set Material Diameter...';
        }

        var reelExt = $(this).find('SetExtNum').text();
        var selExtLoaded = (Number(reelExt) == Number($(this).find('ExtNum').text()));
        if(reelExt == '0'){
          reelExt = 'not fed...';
        }
        else{
          reelExt = '#' + reelExt;
        }

        var emptyReelWeight = $(this).find('SetLoadedReelWeight').attr('emptyWeight');
        if(emptyReelWeight == ''){
          emptyReelWeight = 'enter weight';
        }

        var liveReelWeight = $(this).find('LiveWeight').text();
        if(liveReelWeight == ''){
          console.log('error in mmsData.xml!');
        }

        var loadedReelWeight = $(this).find('SetLoadedReelWeight').text();
        var selLRWLoaded = (Number(loadedReelWeight) == Number($(this).find('LoadedReelWeight').text()));
        if(loadedReelWeight == ''){
          loadedReelWeight = 'not selected';
          emptyReelWeight = 'select reel weight';
        }

        //var matVolume = (Number(liveReelWeight) - Number(emptyReelWeight)) / GetMaterialDensity(reelSelMat);
        var matVolume = Number(liveReelWeight) / GetMaterialDensity(reelSelMat);
        var rSquared = (Number(reelDia) * 0.5) * 0.001; //assumes mm input
        rSquared *= rSquared;
        var remFilament = (matVolume / (_PI * rSquared)).toFixed(2);

        remFilament = (Number(liveReelWeight) > 0.0) ? remFilament : 'reel empty';
        remFilament = (emptyReelWeight != 'enter weight') ? GetDimensionDisplayString('Length', remFilament) : 'enter/select empty reel weight...';
        remFilament = (reelSelMat != 'Select Material...') ? remFilament : 'select Material...';
        //remFilament = (Number(liveReelWeight) > Number(emptyReelWeight)) ? remFilament : 'reel empty';
        emptyReelWeight = GetDimensionDisplayString('Weight', emptyReelWeight);
        liveReelWeight = GetDimensionDisplayString('Weight', liveReelWeight);
        reelDia = GetDimensionDisplayString('MaterialDiameter', reelDia);
        //var loadedReelWeight = GetDimensionDisplayString('Weight', $(this).find('EmptyReelWeight').attr('loadedWeight'));
        var loadedReelWeight = GetDimensionDisplayString('Weight', $(this).find('LoadedReelWeight').text());

        //console.log('liveReelWeight == ' + liveReelWeight);

        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelID + '_extLab').text(reelExt);
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelID +
          '_extLab').css('color', (selExtLoaded) ? 'black' : 'red');
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelMatDropdownID + '_matLab').text(reelSelMat);
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelMatDropdownID +
          '_matLab').css('color', (selMatLoaded) ? 'black' : 'red');
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelDiaDropdownID + '_diaLab').text(reelDia);
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelDiaDropdownID +
          '_diaLab').css('color', (selDiaLoaded) ? 'black' : 'red');
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelID + '_loadedWeightLab').text(loadedReelWeight);
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelID +
          '_loadedWeightLab').css('color', (selLRWLoaded) ? 'black' : 'red');
        /*$('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelWeightDropdownID + '_emptyWeightInput').attr('placeholder', emptyReelWeight + ' (empty reel weight)');*/
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelID + '_liveWeightLab').text(liveReelWeight);
        $('#mmsDataSumDiv').find('#' + MMSDivID).find('#' + reelID + '_remFilLab').text(remFilament);
      });
    });
  });
}
