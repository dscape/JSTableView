// ##Constructor
// __Never call this yourself unless you understand the ramifications!__
var JSTableView = function()
{
  var that = this;
  
  that.options = {
    containerClassName: 'jsTableView',
    indexingToken: 'indexme',
    momentumFPS: 20,
    selector: ''
  };
  
  return that;
};

// ##Static methods
// 
// __JSTableView__.tableViewWithOptions([_options_]) &rarr; ___JSTableView___
// 
// Returns an instance of JSTableView given an optional _options_ object.
// 
// - _options_: a key/object map of named options and values:
// 
//  - _selector_: a CSS selector of an element which will serve as the container for the tableView.
//  - _momentumFPS_: number of times per second to update the position of the list during momentum flow.
//  - _containerClassName_: the className applied to the outer block container.
//  - _data_: an array of data elements as defined by __setData__
JSTableView.tableViewWithOptions = function(options)
{
  var that = new JSTableView();
  
  that.options.merge(options);
  that.init();
  
  return that;
};

// ##Instance methods
// 
// __JSTableView__#init() &rarr; ___JSTableView___
// 
// Inits all of the namespaced iVars and kicks off the other init methods.
JSTableView.prototype.init = function()
{
  var that = this,
      options = that.options,
      t_el = document.querySelector(options.selector);
  
  if( !t_el ) throw new Error('Invalid selector');
  
  that.container = {
    el: t_el,
    height: t_el.offsetHeight
  };
  
  that.list = {
    elements: [],
    coordinates: [],
    scrollable: true,
    atTop: false,
    atBottom: false,
    currentBottom: null,
    currentTop: null,
    direction: null
  };
  
  that.data = {
    elements: [],
    indices: {},
    pointer: {begin: 0, end: 0}
  };
  
  that.buffer = {
    el: null,
    height: null,
    zone: null
  };
  
  that.listener = {
    listening: false,
    locked: false,
    start: {x: 0, y: 0}
  };
  
  that.momentum = {
    velocity: 0,
    timer: null,
    animationRate: 1000/options.momentumFPS
  };
  
  that.stats = {
    timeStart: null,
    distTravelled: null
  };
  
  // Kick off other init methods
  that.__construct();
  that.__setupHandlers();
  
  if(options.data)
    that.setData(options.data);
  
  return that;
}

// __JSTableView__#destroy() &rarr; __boolean__ _success_
// 
// Removes the JSTableView from the DOM and from memory.
JSTableView.prototype.destroy = function()
{
  var that = this;
  
  that.__deconstruct();
  that = null;
  
  return true;
};

// __JSTableView__#\_\_construct() &rarr; ___JSTableView___
// 
// Inits all DOM elements related to the JSTableView.
JSTableView.prototype.__construct = function()
{
  var that = this,
      options = that.options,
      container = that.container,
      buffer = that.buffer,
      list = that.list;
  
  container.el.className = options.containerClassName;
  container.height = (window.innerHeight - container.el.offsetTop);
  container.el.style.cssText = 'height: ' + container.height + 'px';
  
  buffer.el = document.createElement('div');
  
  container.el.appendChild(buffer.el);
  buffer.height = buffer.el.offsetHeight;

  buffer.zone = ( buffer.height - container.height ) / 2;
  list.currentTop = buffer.zone;
  
  return that;
};

// __JSTableView__#\_\_deconstruct() &rarr; ___JSTableView___
// 
// Destroys all DOM elements related to the JSTableView.
JSTableView.prototype.__deconstruct = function()
{
  var that = this,
      container = that.container;
  
  container.el.className = '';
  container.el.style.cssText = '';
  
  container.el.innerHTML = '';
  
  return that;
};

// __JSTableView__#\_\_setupHandlers() &rarr; ___JSTableView___
// 
// _INTERNAL_
// 
// Sets up all event handlers and contains the code for all
// momentum and movement redraw functions.
JSTableView.prototype.__setupHandlers = function()
{
  var that = this,
      data = that.data,
      buffer = that.buffer,
      container = that.container,
      momentum = that.momentum,
      list = that.list,
      listener = that.listener,
      stats = that.stats;
  
  // tick() handles the moving, redraw and re-placement of elements
  var tick = function()
  {
    if( list.direction ) // down
    {
      lastEl = list.elements[0];
      lastElHeight = lastEl.offsetHeight;
      lastElCoordinates = list.coordinates[0];

      while( (lastElCoordinates.y + lastElHeight) < buffer.zone )
      {
        nextData = data.elements[ ++data.pointer.end ];
        if( !nextData ) {
          snapToBottom();
          --data.pointer.end;
          return;
        }
        ++data.pointer.begin;

        list.currentTop += lastElHeight;
        that.__populateCell( lastEl, nextData );
        lastElHeight = lastEl.offsetHeight;

        list.elements.push( list.elements.shift() );
        list.coordinates.push({ x: lastElCoordinates.x, y: list.currentBottom });

        lastEl.style.cssText = 'top: ' + list.currentBottom + 'px; -webkit-transition: none;';
        list.coordinates.shift();

        list.currentBottom += lastElHeight;

        lastEl = list.elements[0];
        lastElHeight = lastEl.offsetHeight;
        lastElCoordinates = list.coordinates[0];
      }
    }
    else    // up
    {
      lastEl = list.elements[ list.elements.length - 1 ];
      lastElHeight = lastEl.offsetHeight;
      lastElCoordinates = list.coordinates[ list.elements.length - 1 ];

      while( lastElCoordinates.y > ( buffer.zone + container.height ) )
      {
        nextData = data.elements[ --data.pointer.begin ];
        if( !nextData ) {
          that.snapToTop();
          ++data.pointer.begin;
          return;
        }
        --data.pointer.end;

        list.currentBottom -= lastElHeight;

        that.__populateCell( lastEl, nextData );
        lastElHeight = lastEl.offsetHeight;

        list.currentTop -= lastElHeight;

        list.elements.unshift( list.elements.pop() );
        list.coordinates.unshift({ x: lastElCoordinates.x, y: list.currentTop });

        lastEl.style.cssText = 'top: ' + list.currentTop + 'px; -webkit-transition: none;';
        list.coordinates.pop();

        lastEl = list.elements[ list.elements.length - 1 ];
        lastElHeight = lastEl.offsetHeight;
        lastElCoordinates = list.coordinates[ list.elements.length - 1 ];
      }
    }
  };
  
  // Event handler for the beginning of a list move
  var onMoveBegin = function(e)
  {
    if(!list.scrollable) return;

    var yCoord = ( e.touches ? e.touches[0].pageY : e.pageY );

    listener.listening = true;
    listener.start = {
      y: yCoord
    };

    stats.timeStart = new Date();
    stats.distTravelled = 0;

    that.killMomentum();
  };
  
  // Event handler for the onTouchMove or onMouseMove events.
  var onMoveMove = function(e)
  {
    e && e.preventDefault();
    
    if(!listener.listening || !list.scrollable) return; 

    var y = ( e.touches ? e.touches[0].pageY : e.pageY ),
      deltaY = y - listener.start.y,
      absDeltaY = Math.abs(deltaY),
      lastEl, lastElCoord, lastElHeight, nextData;  

    if( absDeltaY > 6 )
    {
      list.direction = ( deltaY < 0 );

      if( list.atTop && !list.direction || list.atBottom && list.direction ) return;
      else {
        list.atTop = false;
        list.atBottom = false;
      }

      that.moveListBy(0, deltaY);

      listener.start.y = y;
      list.currentBottom += deltaY;
      list.currentTop += deltaY;
      stats.distTravelled += deltaY;
      
      tick();
    }
    else {
      stats.distTravelled = 0;
      stats.timeStart = new Date();
    }
  };
  
  // momentumTick() handles the momentum (gradual slowdown of the list scrolling)
  // after a touch-and-drag operation.
  var momentumTick = function()
  {
    that.moveListBy(0, momentum.velocity);
    list.currentBottom += momentum.velocity;
    list.currentTop += momentum.velocity;
    momentum.velocity *= 0.93;
    
    tick();
    
    if( Math.abs(momentum.velocity) <= 2 )
    {
      that.killMomentum();
    }
  };
  
  // Event handler for the onTouchEnd or onMouseUp events.
  var onMoveEnd = function(e)
  { 
    if(!list.scrollable) return;

    var duration = new Date() - stats.timeStart;
    listener.listening = false;

    momentum.velocity = (stats.distTravelled / duration) * momentum.animationRate;

    if(!momentum.timer) momentum.timer = setInterval(momentumTick, momentum.animationRate);
  };
  
  // Sets up all of the event handlers.
  buffer.el.ontouchstart = buffer.el.onmousedown = onMoveBegin;
  buffer.el.ontouchmove = buffer.el.onmousemove = onMoveMove;
  buffer.el.ontouchcancel = buffer.el.ontouchend = buffer.el.onmouseup = onMoveEnd;
  
  return that;
}

// __JSTableView__#setData(_listData_) &rarr; ___JSTableView___
// 
// Stores an array of list elements, and populates the list.
// 
// - _listData_: array of elements. Elements are objects composed of the following parameters:
// 
//    {
// 
//    __id__: id to be applied to the list element.
// 
//    __className__: className to be applied to the list element.
// 
//    __text__: text added to the list element via innerHTML.
// 
//    __click__: a function to be applied to the onClick event.
// 
//    }
// 
// All object parameters are optional. Support for additional parameters
// can be added by editing the __\_\_populateCell__ method. 
JSTableView.prototype.setData = function(listData) {
  var that = this,
      data = that.data;
  
  data.elements = listData;
  that.indexData();
  
  that.populateList();
  
  return that;
};

// __JSTableView__#indexData() &rarr; ___JSTableView___
// 
// Super-secret method for an upcoming feature :)
// 
// Essentially stores the numerical index of certain elements
// in the main list array, for easy findin' later.
JSTableView.prototype.indexData = function() {
  var that = this,
      options = that.options,
      data = that.data,
      len = data.elements.length,
      datum;
  
  while(len--)
  {
    datum = data.elements[len];
    
    if(datum.className.indexOf(options.indexingToken) < 0) continue;
    else data.indices[datum.id] = len;
  }
  
  return that;
};

// __JSTableView__#populateList() &rarr; ___JSTableView___
// 
// Forces the list to populate itself with the elements in
// the data array. Also creates the initial list elements
// which will fill the list viewport and be recycled.
JSTableView.prototype.populateList = function(start) {
  var that = this,
      container = that.container,
      buffer = that.buffer,
      data = that.data,
      list = that.list;
  
  if( container.height <= 0 || buffer.height <= 0 ) return;
  
  that.clearList();
  
  var doneYet = false,
      tmpLI, tmpData,
      listHeight = 0,
      top, i = 0,
      tmpUL;
  
  tmpUL = buffer.el.appendChild( document.createElement('ul') );
  tmpUL.className = 'edgetoedge';
  
  data.pointer.end = data.pointer.begin = start || 0;

  list.atTop = (data.pointer.begin == 0);
  list.atBottom = false;
  list.scrollable = true;
  list.elements = [];
  list.coordinates = [];
  list.currentTop = buffer.zone-2;
  
  while( !doneYet )
  {
    if( !(tmpData = data.elements[ data.pointer.end ]) )
    {
      doneYet = true;
      list.scrollable = false;
      continue;
    }
    
    top = ( buffer.zone + listHeight + i );
    i = 2;
    
    tmpLI = document.createElement('li');
    tmpLI.style.cssText = 'top: ' + top + 'px;';

    that.__populateCell(tmpLI, tmpData);
    tmpUL.appendChild( tmpLI );
    
    list.elements.push(tmpLI);
    list.coordinates.push( {x: 0, y: top } );
    
    listHeight += tmpLI.offsetHeight;
    list.currentBottom = buffer.zone + listHeight;
    
    if( listHeight > (container.height + 50) || (++data.pointer.end - data.pointer.begin) > 25 )
    {
      list.scrollable = true;
      doneYet = true;
    }
  }
  
  return that;
};

// __JSTableView__#clearList() &rarr; ___JSTableView___
// 
// $20 to whoever guesses the purpose of this method.*
// 
// *not really.
JSTableView.prototype.clearList = function() {
  var that = this,
      buffer = that.buffer;
  
  buffer.el.innerHTML = "";
  
  return that;
};

// __JSTableView__#\_\_populateCell() &rarr; ___undefined___
// 
// This method takes an object from the data array and applies
// it to a DOM element. Modifying this will allow you to support
// more custom cells; for example, you may want to support
// more DOM events, or more attributes.
JSTableView.prototype.__populateCell = function(el, tmpData) {
  el.id = tmpData.id || '';
  el.className = tmpData.className || '';
  
  if(tmpData.click)
    el.setAttribute('onclick', (tmpData.click || '') );
  else
    el.removeAttribute('onclick');
    
  el.innerHTML = tmpData.text;
};

// __JSTableView__#snapToTop() &rarr; ___JSTableView___
// 
// Snaps the list to the top of the list viewport and
// prevents further scrolling.
JSTableView.prototype.snapToTop = function()
{
  var that = this,
      list = that.list,
      buffer = that.buffer,
      deltaY = buffer.zone - list.coordinates[0].y;
  
  that.killMomentum();
  list.atTop = true;
  
  list.currentTop += deltaY;
  list.currentBottom += deltaY;
  
  that.moveListBy( 0, deltaY );
  
  return that;
};

// __JSTableView__#snapToBottom() &rarr; ___JSTableView___
// 
// Snaps the list to the bottom of the list viewport and
// prevents further scrolling.
JSTableView.prototype.snapToBottom = function()
{
  var that = this,
      container = that.container,
      list = that.list,
      deltaY;
      
  deltaY = ( (container.height + buffer.zone) - list.coordinates[ list.coordinates.length - 1 ].y );
  deltaY -= list.elements[ list.elements.length - 1 ].offsetHeight;
  
  that.killMomentum();
  list.atBottom = true;
  
  list.currentTop += deltaY;
  list.currentBottom += deltaY;
  
  that.moveListBy( 0, deltaY );
  
  return that;
};

// __JSTableView__#moveListBy(_x_, _y_) &rarr; ___JSTableView___
// 
// _INTERNAL_
// Moves each visible list element by (x, y).
// 
// - _x_: _x_-offset
// - _y_: _y_-offset
JSTableView.prototype.moveListBy = function(x, y)
{
  var that = this,
      list = that.list,
      len = list.elements.length, coord;
  
  while(len--)
  {
    coord = list.coordinates[len];
    
    coord.x += x;
    coord.y += y;
    
    list.elements[len].style.cssText = 'left: ' + coord.x + 'px; top: ' + coord.y + 'px;'; 
  }
  
  return that;
};

// __JSTableView__#killMomentum() &rarr; ___JSTableView___
// 
// Kills the list momentum point-blank.
JSTableView.prototype.killMomentum = function()
{
  var that = this,
      momentum = that.momentum,
      listener = that.listener,
      stats = that.stats;
      
  stats.distTravelled = 0;
  
  clearInterval( momentum.timer );
  momentum.timer = false;
  
  return that;
};
