// (c) 2012 Matt Nunes
// Licensed under MIT License
// 
//  __Object__#merge(_obj2_) &rarr; ___Object___
// 
// Merges the properties of _obj2_ into the current object.

Object.defineProperty(Object.prototype, 'merge', {
  enumerable: false,
  value: function(obj2)
  {
    var that = this;
  
    for(var key in obj2)
    {
      that[key] = obj2[key];
    }
  
    return that;
  }
});