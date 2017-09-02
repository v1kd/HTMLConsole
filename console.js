const logger = (function() {

  // Quick implementation of hyperScript
  // https://www.youtube.com/watch?v=LY6y3HbDVmg
  /**
   * 
   * @param {String} nodeName DOM node name
   * @param {Object} attributes DOM properties
   * @param {String|Object} children
   */
  function h(nodeName, attributes, ...children) {
    nodeName = String(nodeName);
    attributes = typeof attributes === 'object' && 
      attributes !== null ? attributes : {};
    return { nodeName, attributes, children };
  }

  /**
   * Create DOM from hyper V object
   * @param {Object} vnode Virtual dom object 
   */
  function render(vnode) {
    if (typeof vnode === 'string') {
      return document.createTextNode(vnode);
    }

    const node = document.createElement(vnode.nodeName);
    if (vnode.attributes) {
      const attrs = vnode.attributes;
      Object.keys(attrs).forEach(
        key => node.setAttribute(key, attrs[key])
      );
    }

    vnode.children.forEach(
      vn => node.appendChild(render(vn))
    );
    return node;
  }

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
            value: { dataType: 'string', data: String(attr.nodeValue) }
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
   * Parsed console object
   * @param {ParsedConsoleObj} obj
   * @return {Object}
   */
  function vnodeString({ data }, shouldRenderQuotes = true) {
    const className = shouldRenderQuotes ?
      'string with-quotes' : 
      'string';
    return h('span', { class: className },
      h('span', { class: 'value' }, data)
    );
  }

  /**
   * Create vnode for undefined, number, null, boolean
   * @param {ParsedConsoleObj} obj
   * @return {Object}
   */
  function vnodeOther({ dataType, data }) {
    return h('span', { class: dataType }, data);
  }

  /**
   * Create vnode for Function
   * @param {ParsedConsoleObj} obj
   * @return {Object}
   */
  function vnodeFunction({ data }) {
    return h('span', { class: 'function' },
      h('span', { class: 'name' }, data)
    );
  }

  /**
   * Create vnode for Function
   * @param {ParsedConsoleObj} obj 
   * @return {Object}
   */
  function vnodeObject(obj) {
    const { constructor, data } = obj;
    return h('span', { class: 'object' },
      h('span', { class: 'constructor' }, constructor),
      h('span', { class: 'body' },
        ...Object.keys(data).map((key) => (
          h('span', { class: 'pair' },
            h('span', { class: 'key' }, key),
            vnodeGeneric(data[key])
          )
        ))
      )
    );
  }

  /**
   * Create vnode for array
   * @param {ParsedConsoleObj} obj 
   * @return {Object}
   */
  function vnodeArray({ data }) {
    return h('span', { class: 'array' },
      ...data.map(val => (
        h('span', { class: 'array-value' },
          vnodeGeneric(val)
        )
      ))
    );
  }

  /**
   * Create vnode for HTML element
   * @param {ParsedConsoleObj} obj 
   * @return {Object}
   */
  function vnodeHTML({ data }) {
    const { tagName, attributes } = data;
    return h('span', { class: 'html' },
      h('span', { class: 'tag' }, tagName),
      ...attributes.map(({ key, value }) => (
        h('span', { class: 'attributes'},
          h('span', { class: 'key' }, key),
          vnodeGeneric(value)
        )
      ))
    );
  }

  /**
   * Create vnode for Generic obj
   * @param {ParsedConsoleObj} obj 
   */
  function vnodeGeneric(obj) {
    const { dataType } = obj;
    let vnode;

    switch (dataType) {
      case 'number':
      case 'undefined':
      case 'null':
      case 'boolean': 
        vnode = vnodeOther(obj);
        break;
      case 'string':
        vnode = vnodeString(obj);
        break;
      case 'function':
        vnode = vnodeFunction(obj);
        break;
      case 'object':
        vnode = vnodeObject(obj);
        break;
      case 'array':
        vnode = vnodeArray(obj);
        break;
      case 'html':
        vnode = vnodeHTML(obj);
        break;
      default:
        vnode = h('span', null, '');
    }
    return vnode;
  }

  /**
   * Get log function
   * @param {HTMLElement} domEle 
   */
  function getLog(domEle) {
    return function(...args) {
      const node = render(
        h('div', { class: 'multi-args' },
          ...args.map(arg => h('span', { class: 'root' },
            vnodeGeneric(parse(arg))
          ))
        )
      );
      domEle.appendChild(node);
    }
  }

  /**
   * Get break function
   * @param {HTMLElement} domEle 
   */
  function getBreak(domEle) {
    return function() {
      const node = render(
        h('div', { class: 'multi-args' }, 
          vnodeGeneric({ dataType: 'empty' }, true)
        )
      );
      domEle.appendChild(node);
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
