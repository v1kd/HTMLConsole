const logger = (function() {

  /**
   * Parse object to console understandable object
   * @param {Object} obj
   * @return {String} obj.dataType
   * @return {Object} obj.data
   * @return {String} obj.constructor? If it is an object
   */
  function parseObject(obj) {
    // null
    if (obj === null) {
      return { data: 'null', dataType: 'null' };
    }

    // HTMLElement
    if (obj instanceof window.HTMLElement) {
      const { tagName: t } = obj;
      return {
        dataType: 'html',
        data: {
          tagName: typeof t === 'string' ? t.toLowerCase() : '',
          attributes: [...obj.attributes].map((attr) => ({
            key: attr.nodeName,
            value: { dataType: 'string', data: attr.nodeValue }
          }))
        }
      };
    }

    // Array
    if (
      typeof obj.length === 'number' &&
      typeof obj.splice === 'function'
    ) {
      return { dataType: 'array', data: obj.map((val) => parse(val)) };
    }

    // Object
    return {
      dataType: 'object',
      constructor: (
        typeof obj.constructor === 'function' &&
        typeof obj.constructor.name === 'string'
      ) ? obj.constructor.name : 'Object',
      data: Object.keys(obj).reduce((o, prop) => {
        o[prop] = parse(obj[prop]);
        return o;
      }, {})
    };
  }
  
  /**
   * To console understandable object
   * @param {*} obj 
   * @return {String} obj.dataType
   * @return {Object} obj.data
   */
  function parse(obj) {
    const type = typeof obj;
    if (
      type === 'number' ||
      type === 'undefined' ||
      type === 'string' ||
      type === 'boolean'
    ) {
      return { dataType: type, data: '' + obj };
    }
    // Object
    if (type === 'object') return parseObject(obj);
    // function
    if (type === 'function') return { dataType: type, data: obj.name };

    return { dataType: 'string', data: '' };
  }

  /**
   * Create a DOM element
   * @param {String} text
   * @param {String} options.tag
   * @param {String|Array} options.className
   */
  function createElement(text = '', options = {}) {
    const { tag = 'span', className = '' } = options;
    const ele = document.createElement(tag);
    ele.textContent = text;
    if (className) {
      const classList = typeof className === 'string' ?
      [className] :
      className;
      ele.classList.add(...classList);
    }
    
    return ele;
  }

  /**
   * Create DOM representation of parsed JS object
   * @param {ParsedConsoleObj} obj 
   * @param {Boolean} isRoot 
   */
  function createOuterElement(obj, isRoot = false) {
    const $ = createElement;
    const { dataType, data } = obj;
    const element = $('', {
      tag: isRoot ? 'div' : 'span',
      className: isRoot ? 'root' : 'child'
    });

    const $add = (...$values) => (
      $values.forEach($val => element.appendChild($val))
    );

    // add data type as class to the element
    element.classList.add(dataType);
    if (
      dataType === 'number' ||
      dataType === 'undefined' ||
      dataType === 'null' ||
      dataType === 'boolean'
    ) element.textContent = data;
    // string
    else if (dataType ===  'string') {
      $add($('"'), $(data, { className: 'value' }), $('"'));
    }
    // function
    else if (dataType === 'function') {
      $add($('function ', { className: 'keyword' }));
      $add($(data + '() {}'));
    }
    // object
    else if (dataType === 'object') {
      $add($(obj.constructor + ' ', { className: 'constructor' }), $('{'));
      let isStart = true;
      Object.keys(data).forEach((key, index) => {
        const val = data[key];
        if (isStart) {
          isStart = false; 
        } else {
          $add($(', '));
        }
        $add(
          $(key, { className: 'key' }),
          $(': '),
          createOuterElement(data[key], false)
        );
      });
      $add($('}'));
    }
    // array
    else if (dataType === 'array') {
      $add($('['));
      let isStart = true;
      data.forEach((val) => {
        if (isStart) {
          isStart = false;
        } else {
          $add($(', '));
        }
        $add(createOuterElement(val, false));
      });
      $add($(']'));
    }
    // html
    else if (dataType === 'html') {
      $add($('<'));
      $add($(data.tagName, { className: 'tag' }));
      data.attributes.forEach(({ key, value }) => {
        $add($(' ' + key, { className: 'key' }));
        $add($('='));
        $add(createOuterElement(value));
      });
      $add($('>'));
      $add($('</'));
      $add($(data.tagName, { className: 'tag' }));
      $add($('>'));
    }
    // empty
    else {
      $add($(' '));
    }

    return element;
  }

  /**
   * Get log function
   * @param {HTMLElement} domEle 
   */
  function getLog(domEle) {
    return function(...args) {
      console.log(args);
      const multiArgEle = createElement('', {
        tag: 'div', className: 'multi-args'
      });
      args.forEach((arg) => multiArgEle.appendChild(
        createOuterElement(parse(arg), true)
      ));
      // const firstObj = args[0];
      // domEle.appendChild(
      //   createOuterElement(parse(firstObj), true)
      // );
      domEle.appendChild(multiArgEle);
    }
  }

  function getBreak(domEle) {
    return function() {
      const multiArgEle = createElement('', {
        tag: 'div', className: 'multi-args'
      });
      multiArgEle.appendChild(
        createOuterElement({ dataType: 'empty' }, true)
      );
      domEle.appendChild(multiArgEle);
    };
  }

  /**
   * Get logger
   * @param {HTMLElement} domEle HTML element where all logs are appended
   */
  return function logger(domEle) {
    if (!(domEle instanceof window.HTMLElement))
      throw TypeError('Required DOM element as first argument');

    const log = getLog(domEle);
    const brek = getBreak(domEle);
    const noop = function() {};
    
    return {
      log, 
      debug: log,
      info: log,
      group: noop,
      break: brek,
      groupEnd: noop,
      warn: noop
    };
  }
}());