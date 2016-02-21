/**
 * Console log html version.
 * This would display all the data in the html
 * It does not work when the elements have parent and then child
 * stack overflow
 */
var c = (function() {
  var o = document.getElementsByClassName('console')[0];
  var callStack = 0;
  var getType = function(obj) {
    var type = typeof obj;
    var op = {
      data: '',
      dataType: 'string'
    };
    switch (type) {
      case 'number':
      case 'string':
      case 'undefined':
      case 'boolean':
        op = {
          data: obj + '',
          dataType: type
        };
        break;
      case 'object':
        callStack++;
        if (obj === null) {
          op = {
            data: 'null',
            dataType: 'null'
          }
          break;
        }
        // check if html element
        if (obj instanceof HTMLElement) {
          var htmlAttrs = obj.attributes;
          var attrs = [];
          if (htmlAttrs && htmlAttrs.length > 0) {
            for (var i = 0; i < htmlAttrs.length; i++) {
              attrs.push({
                key: htmlAttrs[i].nodeName,
                value: {
                  dataType: 'string',
                  data: htmlAttrs[i].nodeValue
                }
              });
            }
          }

          op = {
            data: {
              tagName: obj.tagName ? obj.tagName.toLowerCase() : '',
              attrs: attrs
            },
            dataType: 'html'
          };
          console.log(attrs)
          break;
        }
        // if array - doesnt work for all of them - function arguments
        if (typeof obj.length === 'number' && typeof obj.splice === 'function') {
          op = {
            data: [],
            dataType: 'array'
          };
          for (var i = 0; i < obj.length; i++) {
            op.data.push(getType(obj[i]));
          }
          break;
        }
        op = {
          data: {},
          dataType: 'object',
          constructor: 'Object'
        };
        
        var constructor = obj.constructor;
        if (typeof constructor === 'function' && constructor.name) {
          op.constructor = constructor.name;
        }
        for (var i in obj) {
          op.data[i] = getType(obj[i]);
        }
        break;
      case 'function':
        op = {
          data: obj.name,
          dataType: 'function'
        };
        break;
    }
    return op
  };

  var getDOMRepr = function(obj, isRoot) {
    var domType = 'div'
    if (!isRoot)
      domType = 'span'
    var outer = document.createElement(domType);
    outer.classList.add(obj.dataType);
    switch (obj.dataType) {
      case 'number':
      case 'undefined':
      case 'null':
      case 'boolean':
        outer.textContent = obj.data;
        break;
      case 'string':
        span = document.createElement('span');
        span.textContent = '"';
        outer.appendChild(span);
        span = document.createElement('span');
        span.classList.add('value');
        span.textContent = obj.data;
        outer.appendChild(span)
        span = document.createElement('span');
        span.textContent = '"';
        outer.appendChild(span);
        // outer.textContent = '"' + obj.data + '"';
        break;
      case 'function':
        var span = document.createElement('span');
        span.classList.add('keyword')
        outer.appendChild(span);
        span.textContent = 'function ';
        span = document.createElement('span')
        span.textContent = obj.data + '() {}'
        outer.appendChild(span)
        break;
      case 'object':
        var span = document.createElement('span');
        span.textContent = obj.constructor + ' '
        span.classList.add('constructor')
        outer.appendChild(span)
        var span = document.createElement('span');
        span.textContent = '{'
        outer.appendChild(span);
        var isStart = true;
        for (var i in obj.data) {
          if (isStart) {
            isStart = false;
          } else {
            // append a ,
            span = document.createElement('span');
            span.textContent = ', '
            outer.appendChild(span);
          }
          span = document.createElement('span');
          span.textContent = i
          span.classList.add('key')
          outer.appendChild(span);
          span = document.createElement('span');
          span.textContent = ': '
          outer.appendChild(span)
          outer.appendChild(getDOMRepr(obj.data[i]), false)
        }
        span = document.createElement('span');
        span.textContent = '}';
        outer.appendChild(span);
        break;
      case 'array':
        var span = document.createElement('span');
        span.textContent = '['
        outer.appendChild(span);
        var isStart = true;
        for (var i = 0; i < obj.data.length; i++) {
          if (isStart) {
            isStart = false;
          } else {
            // append a ,
            span = document.createElement('span');
            span.textContent = ', '
            outer.appendChild(span);
          }
          outer.appendChild(getDOMRepr(obj.data[i]), false)
        }
        span = document.createElement('span');
        span.textContent = ']';
        outer.appendChild(span);
        break;
      case 'html':
        var span = document.createElement('span');
        span.textContent = '<';
        outer.appendChild(span);
        span = document.createElement('span');
        span.classList.add('tag');
        outer.appendChild(span);
        span.textContent = obj.data.tagName;
        // attribures
        var attrs = obj.data.attrs;
        console.log(attrs)
        if (attrs && attrs.length > 0) {
          for (var i = 0; i < attrs.length; i++) {
            span = document.createElement('span');
            span.classList.add('key');
            span.textContent = ' ' + attrs[i].key;
            outer.appendChild(span);
            span = document.createElement('span');
            span.textContent = '=';
            outer.appendChild(span);
            outer.appendChild(getDOMRepr(attrs[i].value));
          }
        }
        span = document.createElement('span');
        span.textContent = '>';
        outer.appendChild(span);
        // closing tag
        span = document.createElement('span');
        span.textContent = '</';
        outer.appendChild(span);
        span = document.createElement('span');
        span.textContent = obj.data.tagName;
        span.classList.add('tag');
        outer.appendChild(span);
        span = document.createElement('span');
        span.textContent = '>';
        outer.appendChild(span);
        break;
    }
    return outer;
  };

  var init = function() {
    // init all the values
    callStack = 0;
  };
  var comingSoon = 'Coming Soon!!'
  return {
    log: function(obj) {
      init();
      var consoleObj = getType(obj);
      var ele = getDOMRepr(consoleObj, true);
      o.appendChild(ele)
    },
    clear: function() {
      init();
      o.innerHTML = '';
    },
    warn: function() {
      init();
      this.log(comingSoon);
    },
    info: function() {
      init();
      this.log(comingSoon);
    },
    debug: function() {
      init();
      this.log(comingSoon);
    }
  }
})();