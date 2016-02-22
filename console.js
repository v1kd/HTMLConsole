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

  var getDOM = function(options) {
    // by default create span element
    var tag = options.tag || 'span';
    var text = options.text;
    var className =  options.className;
    var ele = document.createElement(tag)
    if (typeof text !== 'undefined') {
      ele.textContent = text;
    }

    if (className) {
      var arr
      if (typeof className === 'string') {
        arr = [];
        arr.push(className);
      } else {
        // classname is array
        arr = className;
      }
      DOMTokenList.prototype.add.apply(ele.classList, arr);
    }

    return ele;
  }

  var getDOMRepr = function(obj, isRoot) {
    var domType = 'div'
    if (!isRoot)
      domType = 'span'
    var outer = getDOM({ 'tag': domType });
    outer.classList.add(obj.dataType);
    switch (obj.dataType) {
      case 'number':
      case 'undefined':
      case 'null':
      case 'boolean':
        outer.textContent = obj.data;
        break;
      case 'string':
        outer.appendChild(getDOM({ text: '"' }));
        outer.appendChild(getDOM({
          text: obj.data,
          className: 'value'
        }));
        outer.appendChild(getDOM({ text: '"' }))
        break;
      case 'function':
        outer.appendChild(getDOM({
          text: 'function ',
          className: 'keyword'
        }));
        outer.appendChild(getDOM({ text: obj.data + '() {}' }));
        break;
      case 'object':
        outer.appendChild(getDOM({
          text: obj.constructor + ' ',
          className: 'constructor'
        }));
        outer.appendChild(getDOM({ text: '{' }));

        var isStart = true;
        for (var i in obj.data) {
          if (isStart) {
            isStart = false;
          } else {
            outer.appendChild(getDOM({ text: ', ' }));
          }
          outer.appendChild(getDOM({
            text: i,
            className: 'key'
          }));
          outer.appendChild(getDOM({ text: ': ' }));
          outer.appendChild(getDOMRepr(obj.data[i]), false)
        }
        outer.appendChild(getDOM({ text: '}' }));
        break;
      // array object
      case 'array':
        outer.appendChild(getDOM({ text: '[' }));
        var isStart = true;
        for (var i = 0; i < obj.data.length; i++) {
          if (isStart) {
            isStart = false;
          } else {
            // append a ,
            outer.appendChild(getDOM({ text: ', '} ));
          }
          outer.appendChild(getDOMRepr(obj.data[i]), false)
        }
        outer.appendChild(getDOM({ text: ']' }));
        break;
      // html object
      case 'html':
        outer.appendChild(getDOM({ text: '<' }))
        outer.appendChild(getDOM({ 
          text: obj.data.tagName,
          className: 'tag'
        }));
        // attributes
        var attrs = obj.data.attrs;
        if (attrs && attrs.length > 0) {
          for (var i = 0; i < attrs.length; i++) {
            outer.appendChild(getDOM({ 
              text: ' ' + attrs[i].key,
              className: 'key'
            }))
            outer.appendChild(getDOM({ text: '=' }));
            outer.appendChild(getDOMRepr(attrs[i].value));
          }
        }
        outer.appendChild(getDOM({ text: '>' }));
        // closing tag
        outer.appendChild(getDOM({ text: '</' }));
        outer.appendChild(getDOM({ 
          text: obj.data.tagName,
          className: 'tag'
        }));
        outer.appendChild(getDOM({ text: '>'}));
        break;

      case 'empty':
        outer.appendChild(getDOM({ text: ' ' }));
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
    },
    'break': function() {
      o.classList.add('break');
      init();
      var empty = { dataType: 'empty' };
      var ele = getDOMRepr(empty, true);
      o.appendChild(ele);
    }
  }
})();