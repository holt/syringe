// Array.filter polyfill (MDN)
[].filter||(Array.prototype.filter=function(c,f){if(null==this)throw new TypeError;var b=Object(this),g=b.length>>>0;if("function"!=typeof c)throw new TypeError;for(var d=[],a=0;a<g;a++)if(a in b){var e=b[a];c.call(f,e,a,b)&&d.push(e)}return d});

// Array.map polyfill (MDN)
[].map||(Array.prototype.map=function(d,f){var g,e,a;if(null==this)throw new TypeError(" this is null or not defined");var b=Object(this),h=b.length>>>0;if("function"!==typeof d)throw new TypeError(d+" is not a function");f&&(g=f);e=Array(h);for(a=0;a<h;){var c;a in b&&(c=b[a],c=d.call(g,c,a,b),e[a]=c);a++}return e});

// Array.reduce polyfill (MDN)
"function"!==typeof Array.prototype.reduce&&(Array.prototype.reduce=function(d,e){if(null===this||"undefined"===typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");if("function"!==typeof d)throw new TypeError(d+" is not a function");var a=0,f=this.length>>>0,b,c=!1;1<arguments.length&&(b=e,c=!0);for(;f>a;++a)this.hasOwnProperty(a)&&(c?b=d(b,this[a],a,this):(b=this[a],c=!0));if(!c)throw new TypeError("Reduce of empty array with no initial value");return b});

// Function.bind polyfill (MDN)
Function.prototype.bind||(Function.prototype.bind=function(b){if("function"!==typeof this)throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");var d=Array.prototype.slice.call(arguments,1),e=this,a=function(){},c=function(){return e.apply(this instanceof a&&b?this:b,d.concat(Array.prototype.slice.call(arguments)))};a.prototype=this.prototype;c.prototype=new a;return c});

// syringe-min.js v0.1.1
(function(){var g=this;g.syringe=function(h){var d={},l={}.hasOwnProperty,m=[].slice,n=Object.prototype.toString,p=/^function\s*[^\(]*\(\s*([^\)]*)\)/m,q=/^\s*(_?)(\S+?)\1\s*$/,r=/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,f=function(a,c){var b=n.call(a).slice(8,-1);return c&&b.toLowerCase()||b},s=function(a,c,b){c=c||this;a=a.split(b||".");b=null;return b=a.filter(function(a){return a.length}).reduce(function(a,b,c,d){if(a)return a[d[c]]},c)},j=function(a,c,b){c=c||this;a=a.split(b||".");var e,d;e=0;for(d= a.length;e<d;e++)b=a[e],c=c[b]=c[b]||{};return c},t=function(a){return a.map(function(a){return d[a]},this)},k=function(){var a=m.call(arguments),c=a.shift(),b=c.toString().replace(r,"").match(p),b=t(b[1].split(",").map(function(a){return a.replace(q,function(a,b,c){return c})}));b.length-=a.length;return c.apply(this,b.concat(a))},d="object"===f(h,!0)?h:d;return{register:function(a,c){if("object"===f(a,!0)){for(var b in a)l.call(a,b)&&this.register.apply(this,[b,a[b]]);return this}d[a]=c;return this}, bind:function(a,c,b){if("string"===f(a,!0)&&"function"===f(c,!0)){b=b||g;a=a.split(".");var d=1<a.length?a.pop():!1;c=k.bind(b,c);if(d)j(a.join("."),b)[d]=c;else return b[a.join(".")]=c}else if("function"===f(a,!0))return b="object"===f(c,!0)?c:g,k.bind(b,a)},list:function(){return d},get:function(a){return s(a,d)},set:function(a,c){var b=a.split("."),e=1<b.length?b.pop():!1;e?j(b.join("."),d)[e]=c:d[b.toString()]=c;return this},remove:function(a){delete d[a];return this}}}}).call(this);