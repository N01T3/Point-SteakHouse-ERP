// GENERATED from dc-runtime/src/*.ts - do not edit. Rebuild with `bun build.ts` (see the package README for the source-only recipe).
"use strict";

var _excluded = ["__name", "__hintSize", "__tplId", "__hostStyle"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
(function () {
  var xt = Object.defineProperty,
    Et = function Et(t, n, e) {
      return n in t ? xt(t, n, {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: e
      }) : t[n] = e;
    },
    M = function M(t, n, e) {
      return Et(t, _typeof(n) != "symbol" ? n + "" : n, e);
    };
  function T() {
    var t = window.React;
    if (!t) throw new Error("dc-runtime: window.React is not available yet");
    return t;
  }
  function St() {
    var t = window.ReactDOM;
    if (!t) throw new Error("dc-runtime: window.ReactDOM is not available yet");
    return t;
  }
  var A = function A() {
    var _T;
    return (_T = T()).createElement.apply(_T, arguments);
  };
  function kt(t) {
    var _e$getAttribute;
    var n = t.querySelector("x-dc");
    if (!n) return null;
    var e = t.querySelector("script[data-dc-script]"),
      _B = B((_e$getAttribute = e === null || e === void 0 ? void 0 : e.getAttribute("data-props")) !== null && _e$getAttribute !== void 0 ? _e$getAttribute : null),
      r = _B.props,
      o = _B.preview;
    return {
      template: n.innerHTML,
      js: e && e.textContent || "",
      props: r,
      preview: o
    };
  }
  function X(t) {
    var _i$getAttribute;
    var n = /<x-dc(?:\s[^>]*)?>/.exec(t);
    if (!n) return null;
    var e = t.lastIndexOf("</x-dc>");
    if (e === -1 || e < n.index) return null;
    var r = t.slice(n.index + n[0].length, e),
      i = new DOMParser().parseFromString(t, "text/html").querySelector("script[data-dc-script]"),
      _B2 = B((_i$getAttribute = i === null || i === void 0 ? void 0 : i.getAttribute("data-props")) !== null && _i$getAttribute !== void 0 ? _i$getAttribute : null),
      s = _B2.props,
      l = _B2.preview;
    return {
      template: r,
      js: i && i.textContent || "",
      props: s,
      preview: l
    };
  }
  function B(t) {
    if (!t) return {
      props: null,
      preview: null
    };
    var n;
    try {
      n = JSON.parse(t);
    } catch (_unused) {
      return {
        props: null,
        preview: null
      };
    }
    if (!n || _typeof(n) != "object" || Array.isArray(n)) return {
      props: null,
      preview: null
    };
    var e = n,
      r = e.$preview && _typeof(e.$preview) == "object" ? e.$preview : null,
      o = {};
    for (var _i = 0, _Object$keys = Object.keys(e); _i < _Object$keys.length; _i++) {
      var i = _Object$keys[_i];
      i[0] !== "$" && (o[i] = e[i]);
    }
    return {
      props: Object.keys(o).length ? o : null,
      preview: r
    };
  }
  function At(t) {
    var n = t || "";
    try {
      n = decodeURIComponent(n);
    } catch (_unused2) {}
    return (n.split("/").pop() || "Root").replace(/\.dc\.html$|\.html?$/, "") || "Root";
  }
  var Ct = "\n    .sc-placeholder{background:color-mix(in srgb,currentColor 8%,transparent);\n      border:1px solid color-mix(in srgb,currentColor 50%,transparent);\n      border-radius:2px;box-sizing:border-box;overflow:hidden}\n    @keyframes sc-shine{0%{background-position:100% 50%}100%{background-position:0% 50%}}\n    html.sc-dc-streaming .sc-placeholder,\n    html.sc-dc-streaming .sc-interp.sc-missing{position:relative;\n      background:color-mix(in srgb,currentColor 5%,transparent);\n      border-color:transparent}\n    html.sc-dc-streaming .sc-placeholder::before,\n    html.sc-dc-streaming .sc-interp.sc-missing::before{content:'';\n      position:absolute;inset:0;pointer-events:none;\n      background:linear-gradient(90deg,rgba(217,119,87,0) 25%,rgba(247,225,211,.95) 37%,rgba(217,119,87,0) 63%);\n      background-size:400% 100%;animation:sc-shine 1.4s ease infinite}\n    html.sc-dc-streaming .sc-placeholder:nth-child(n+9 of .sc-placeholder)::before,\n    html.sc-dc-streaming .sc-interp.sc-missing:nth-child(n+9 of .sc-interp.sc-missing)::before{animation:none;\n      background:color-mix(in srgb,currentColor 8%,transparent)}\n    .sc-placeholder-error{padding:4px 8px;font:11px/1.4 ui-monospace,monospace;\n      color:color-mix(in srgb,currentColor 70%,transparent);word-break:break-word}\n    .sc-interp.sc-missing{display:inline-block;width:2em;height:1em;overflow:hidden;\n      vertical-align:text-bottom;background:rgba(255,255,255,.3);border:1px solid rgba(0,0,0,.5);\n      border-radius:2px;box-sizing:border-box;color:transparent;\n      user-select:none}\n    .sc-interp.sc-unresolved{font-family:ui-monospace,monospace;font-size:.85em;\n      color:color-mix(in srgb,currentColor 50%,transparent);\n      background:color-mix(in srgb,currentColor 10%,transparent);border-radius:3px;\n      padding:0 3px}\n    .sc-host.sc-has-error{position:relative}\n    .sc-logic-error{position:absolute;top:8px;left:8px;z-index:2147483647;max-width:60ch;\n      padding:6px 10px;background:#b00020;color:#fff;font:12px/1.4 ui-monospace,monospace;\n      border-radius:4px;white-space:pre-wrap;pointer-events:none}\n    /* Mirrors PRINT_BASELINE_CSS in apps/web deck-stage-export.ts \u2014 keep both\n       in sync until dc-runtime regains a build step. */\n    @media print {\n      @page { margin: 0.5cm; }\n      figure, table { break-inside: avoid; }\n      #dc-root, #dc-root > .sc-host { height: auto; }\n      *, *::before, *::after {\n        print-color-adjust: exact; -webkit-print-color-adjust: exact;\n        backdrop-filter: none !important; -webkit-backdrop-filter: none !important;\n        animation-delay: -99s !important; animation-duration: .001s !important;\n        animation-iteration-count: 1 !important; animation-fill-mode: both !important;\n        animation-play-state: running !important; transition-duration: 0s !important;\n      }\n    }\n  ",
    Nt = "html,body{height:100%;margin:0}#dc-root,#dc-root>.sc-host{height:100%}";
  function Rt(t, n) {
    var e = n.pathname || "";
    if (!/\.dc\.html?$/i.test(Lt(e))) try {
      e = new URL(t.baseURI || "/").pathname;
    } catch (_unused3) {}
    return At(e);
  }
  function Lt(t) {
    try {
      return decodeURIComponent(t);
    } catch (_unused4) {
      return t;
    }
  }
  function Mt(t) {
    var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;
    var e = kt(n);
    if (!e) return null;
    var r = T(),
      o = Rt(n, location);
    t.markFetched(o), t.setRootName(o), t.adoptParsed(o, e), window.__resources || fetch(location.href).then(function (b) {
      return b.ok ? b.text() : "";
    }).then(function (b) {
      var u = b ? X(b) : null;
      (u === null || u === void 0 ? void 0 : u.template) && t.updateHtml(o, u.template);
    }).catch(function () {});
    var i = n.querySelector("x-dc"),
      s = n.createElement("div");
    if (s.id = "dc-root", i.replaceWith(s), !e.preview) {
      var b = n.createElement("style");
      b.textContent = Nt, n.head.appendChild(b);
    }
    var l = t.getDC(o),
      a = t.registry.get(o);
    function c() {
      var _r$useState = r.useState(0),
        _r$useState2 = _slicedToArray(_r$useState, 2),
        b = _r$useState2[1];
      r.useEffect(function () {
        var f = function f() {
          return b(function (m) {
            return m + 1;
          });
        };
        return a.subs.add(f), function () {
          a.subs.delete(f);
        };
      }, []);
      var u = r.useMemo(function () {
        var f = {};
        for (var m in a.propsMeta || {}) {
          var _a$propsMeta;
          var g = (_a$propsMeta = a.propsMeta) === null || _a$propsMeta === void 0 || (_a$propsMeta = _a$propsMeta[m]) === null || _a$propsMeta === void 0 ? void 0 : _a$propsMeta.default;
          g !== void 0 && (f[m] = g);
        }
        return f;
      }, [a.propsMeta]);
      return A(l, _objectSpread(_objectSpread({}, u), a.propOverrides || {}));
    }
    var p = St();
    return p.createRoot ? p.createRoot(s).render(A(c)) : p.render(A(c), s), o;
  }
  var Y = /^[A-Za-z_$][A-Za-z0-9_$]*/,
    Tt = /^-?\d+(\.\d+)?$/;
  function P(t, n) {
    var e = String(n).trim();
    if (!e) return;
    if (e[0] === "(" && e[e.length - 1] === ")" && Ot(e)) return P(t, e.slice(1, -1));
    var r = Pt(e);
    if (r) {
      var o = P(t, e.slice(0, r.index)),
        i = P(t, e.slice(r.index + r.op.length));
      switch (r.op) {
        case "===":
          return o === i;
        case "!==":
          return o !== i;
        case "==":
          return o == i;
        default:
          return o != i;
      }
    }
    if (e[0] === "!") return !P(t, e.slice(1));
    if (e === "true") return !0;
    if (e === "false") return !1;
    if (e === "null") return null;
    if (e !== "undefined") return Tt.test(e) ? Number(e) : e.length >= 2 && (e[0] === '"' || e[0] === "'") && e[e.length - 1] === e[0] ? e.slice(1, -1) : jt(t, e);
  }
  function Ot(t) {
    var n = 0;
    for (var e = 0; e < t.length - 1; e++) if (t[e] === "(") n++;else if (t[e] === ")" && (n--, n === 0)) return !1;
    return !0;
  }
  function Pt(t) {
    var n = 0;
    for (var e = 0; e < t.length; e++) {
      var r = t[e];
      if (r === "[" || r === "(") n++;else if (r === "]" || r === ")") n--;else if (n === 0 && (r === "=" || r === "!") && t[e + 1] === "=") {
        if (e > 0 && (t[e - 1] === "=" || t[e - 1] === "!") || !t.slice(0, e).trim()) continue;
        var o = t[e + 2] === "=" ? r + "==" : r + "=";
        return {
          index: e,
          op: o
        };
      }
    }
    return null;
  }
  function jt(t, n) {
    var e = n.match(Y);
    if (!e) return;
    var r = t === null || t === void 0 ? void 0 : t[e[0]],
      o = e[0].length;
    for (; o < n.length;) if (n[o] === ".") {
      var _r;
      var i = n.slice(o + 1).match(Y) || n.slice(o + 1).match(/^\d+/);
      if (!i) return;
      r = (_r = r) === null || _r === void 0 ? void 0 : _r[i[0]], o += 1 + i[0].length;
    } else if (n[o] === "[") {
      var _r2;
      var _i2 = 1,
        s = o + 1;
      for (; s < n.length && _i2 > 0;) {
        if (n[s] === "[") _i2++;else if (n[s] === "]" && (_i2--, _i2 === 0)) break;
        s++;
      }
      if (_i2 !== 0) return;
      var l = P(t, n.slice(o + 1, s));
      r = (_r2 = r) === null || _r2 === void 0 ? void 0 : _r2[l], o = s + 1;
    } else return;
    return r;
  }
  var W = "sc-camel-",
    Dt = new Set("a abbr b bdi bdo br cite code del dfn em i ins kbd mark q s samp small span strike strong sub sup u var wbr".split(" ")),
    Q = {
      select: "sc-raw-select",
      table: "sc-raw-table",
      tbody: "sc-raw-tbody",
      thead: "sc-raw-thead",
      tfoot: "sc-raw-tfoot",
      tr: "sc-raw-tr",
      td: "sc-raw-td",
      th: "sc-raw-th",
      caption: "sc-raw-caption"
    },
    tt = Object.fromEntries(Object.entries(Q).map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
        t = _ref2[0],
        n = _ref2[1];
      return [n, t];
    })),
    zt = {
      onclick: "onClick",
      onchange: "onChange",
      oninput: "onInput",
      onsubmit: "onSubmit",
      onkeydown: "onKeyDown",
      onkeyup: "onKeyUp",
      onkeypress: "onKeyPress",
      onmousedown: "onMouseDown",
      onmouseup: "onMouseUp",
      onmouseenter: "onMouseEnter",
      onmouseleave: "onMouseLeave",
      onfocus: "onFocus",
      onblur: "onBlur",
      ondoubleclick: "onDoubleClick",
      oncontextmenu: "onContextMenu",
      onmousemove: "onMouseMove",
      onmouseover: "onMouseOver",
      onmouseout: "onMouseOut",
      onpointerdown: "onPointerDown",
      onpointerup: "onPointerUp",
      onpointermove: "onPointerMove",
      onpointerenter: "onPointerEnter",
      onpointerleave: "onPointerLeave",
      onpointercancel: "onPointerCancel",
      onpointerover: "onPointerOver",
      onpointerout: "onPointerOut",
      ongotpointercapture: "onGotPointerCapture",
      onlostpointercapture: "onLostPointerCapture",
      ontouchstart: "onTouchStart",
      ontouchend: "onTouchEnd",
      ontouchmove: "onTouchMove",
      ontouchcancel: "onTouchCancel",
      ondragstart: "onDragStart",
      ondragend: "onDragEnd",
      ondragenter: "onDragEnter",
      ondragleave: "onDragLeave",
      ondragover: "onDragOver",
      onanimationstart: "onAnimationStart",
      onanimationend: "onAnimationEnd",
      onanimationiteration: "onAnimationIteration",
      ontransitionend: "onTransitionEnd"
    },
    It = "(?:[^>\"']|\"[^\"]*\"|'[^']*')*",
    Ut = new RegExp("<(x-import|dc-import)(" + It + ")/>", "gi"),
    Gt = /(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)/g;
  function Ft(t) {
    return t.replace(Gt, function (n, e, r, o) {
      return e + W + r.replace(/[A-Z]/g, function (i) {
        return "-" + i.toLowerCase();
      }) + o;
    });
  }
  function Bt(t) {
    t = t.replace(Ut, function (n, e, r) {
      return "<" + e + r + "></" + e + ">";
    }), t = t.replace(/<helmet(\s|>)/gi, "<sc-helmet$1"), t = t.replace(/<\/helmet\s*>/gi, "</sc-helmet>"), t = Ft(t);
    for (var _i3 = 0, _Object$entries = Object.entries(Q); _i3 < _Object$entries.length; _i3++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i3], 2),
        n = _Object$entries$_i[0],
        e = _Object$entries$_i[1];
      t = t.replace(new RegExp("(</?)" + n + "(?=[\\s>])", "gi"), "$1" + e);
    }
    return t;
  }
  function U(t) {
    return t.replace(/-([a-z])/g, function (n, e) {
      return e.toUpperCase();
    });
  }
  function Wt(t) {
    if (t.startsWith("--") || !/[a-z][A-Z]/.test(t)) return t;
    if (t === "cssFloat") return "float";
    var n = t.replace(/[A-Z]/g, function (e) {
      return "-" + e.toLowerCase();
    });
    return /^(webkit|moz|ms|o)-/.test(n) ? "-" + n : n;
  }
  function et(t) {
    var n = {};
    var _iterator = _createForOfIteratorHelper(t.split(";")),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var e = _step.value;
        var r = e.indexOf(":");
        if (r < 0) continue;
        var o = e.slice(0, r).trim();
        n[o.startsWith("--") ? o : U(o)] = e.slice(r + 1).trim();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return n;
  }
  function O(t) {
    var n = t.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
    if (n) {
      var e = n[1];
      return function (r) {
        return P(r, e);
      };
    }
    if (t.includes("{{")) {
      var _e2 = t.split(/\{\{([\s\S]+?)\}\}/g);
      return function (r) {
        return _e2.map(function (o, i) {
          var _P;
          return i & 1 ? (_P = P(r, o)) !== null && _P !== void 0 ? _P : "" : o;
        }).join("");
      };
    }
    return function () {
      return t;
    };
  }
  function $t(t) {
    return t === "constructor" || t === "prototype" ? !1 : /^(?:--[a-zA-Z0-9_-]+|[a-z][a-z0-9-]*)$/.test(t);
  }
  var qt = /^data-keyframes-(css|attr)-(.+)$/;
  function Vt(t) {
    var n = qt.exec(t);
    return n ? {
      kind: n[1],
      prop: n[2]
    } : null;
  }
  var Ht = new Set(["script", "style", "link", "meta", "base", "iframe", "frame", "embed", "object", "portal", "template", "head", "html", "body", "animate", "set", "animatemotion", "applet", "frameset", "noembed", "xmp"]);
  function Kt(t) {
    return !Ht.has(t.toLowerCase());
  }
  function Zt(t) {
    return !(!/^[a-z][a-z0-9-]*$/.test(t) || t.startsWith("on") || t === "srcdoc" || t === "style" || t === "class" || t === "id" || t === "is" || t === "contenteditable" || t === "key" || t === "ref" || t === "children" || t === "dangerouslysetinnerhtml" || t.startsWith("data-dc-") || t.startsWith("data-om-") || t.startsWith("data-dm-") || t.startsWith("data-react-") || t.startsWith("data-keyframes-") || t.startsWith("sc-camel-"));
  }
  var Jt = new Set(["href", "action", "formaction", "cite", "ping", "longdesc"]),
    Xt = new Set(["src", "srcset", "poster", "data", "background"]);
  function Yt(t, n) {
    var e = String(n),
      r = Jt.has(t);
    if (!r && !Xt.has(t)) return e;
    var o = t === "srcset" ? e.split(",").map(function (i) {
      var _i$trim$split$;
      return (_i$trim$split$ = i.trim().split(/\s+/)[0]) !== null && _i$trim$split$ !== void 0 ? _i$trim$split$ : "";
    }) : t === "ping" ? e.trim().split(/\s+/) : [e];
    var _iterator2 = _createForOfIteratorHelper(o),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var i = _step2.value;
        if (!Qt(i, r)) return null;
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    return e;
  }
  function Qt(t, n) {
    var e = t.replace(/[\t\n\r]/g, "").trim();
    if (!e) return !0;
    try {
      var r = new URL(e, "https://dc-keyframes-base.invalid/").protocol;
      return r === "http:" || r === "https:" || n && (r === "mailto:" || r === "tel:") ? !0 : !n && r === "data:" && /^data:image\/(?!svg)/i.test(e.replace(/\s+/g, ""));
    } catch (_unused5) {
      return !1;
    }
  }
  function te(t) {
    var n = t;
    if (typeof n == "string") {
      var e = n.trim();
      if (!e) return null;
      var r = I.get(e);
      if (r !== void 0) return r;
      var o;
      try {
        o = JSON.parse(e);
      } catch (_unused6) {
        return I.set(e, null), null;
      }
      var i = nt(o);
      return I.size > 512 && I.clear(), I.set(e, i), i;
    }
    return nt(n);
  }
  var I = new Map();
  function nt(t) {
    if (!Array.isArray(t)) return null;
    var n = [];
    var _iterator3 = _createForOfIteratorHelper(t),
      _step3;
    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var e = _step3.value;
        if (!e || _typeof(e) != "object" || Array.isArray(e)) continue;
        var r = e.t,
          o = e.v;
        typeof r != "number" || !Number.isFinite(r) || (typeof o == "number" ? !Number.isFinite(o) : typeof o != "string") || n.push(e);
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
    return n.length ? n.sort(function (e, r) {
      return e.t - r.t;
    }) : null;
  }
  function ee(t, n) {
    var e = t[0];
    if (n <= e.t) return e.v;
    var r = t[t.length - 1];
    if (n >= r.t) return r.v;
    var o = 0;
    for (; o < t.length - 1 && t[o + 1].t <= n;) o++;
    var i = t[o],
      s = t[o + 1];
    if (s.t === i.t) return s.v;
    var l = (n - i.t) / (s.t - i.t);
    return oe(i.v, s.v, re(i.ease, l), l);
  }
  var rt = {
      in: [.42, 0, 1, 1],
      out: [0, 0, .58, 1],
      inOut: [.42, 0, .58, 1],
      ease: [.25, .1, .25, 1],
      "ease-in": [.42, 0, 1, 1],
      "ease-out": [0, 0, .58, 1],
      "ease-in-out": [.42, 0, .58, 1]
    },
    ne = /^cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/i;
  function re(t, n) {
    if (n <= 0) return 0;
    if (n >= 1) return 1;
    if (typeof t != "string" || !t || t === "linear") return n;
    var e = Object.hasOwn(rt, t) ? rt[t] : void 0;
    if (e) return ot(e, n);
    var r = ne.exec(t.trim());
    if (r) {
      var o = $(Number(r[1])),
        i = Number(r[2]),
        s = $(Number(r[3])),
        l = Number(r[4]);
      if ([o, i, s, l].every(Number.isFinite)) return ot([o, i, s, l], n);
    }
    return n;
  }
  function $(t) {
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }
  function ot(_ref3, o) {
    var _ref4 = _slicedToArray(_ref3, 4),
      t = _ref4[0],
      n = _ref4[1],
      e = _ref4[2],
      r = _ref4[3];
    var i = 3 * t,
      s = 3 * (e - t) - i,
      l = 1 - i - s,
      a = 3 * n,
      c = 3 * (r - n) - a,
      p = 1 - a - c,
      b = function b(y) {
        return ((l * y + s) * y + i) * y;
      },
      u = function u(y) {
        return ((p * y + c) * y + a) * y;
      },
      f = function f(y) {
        return (3 * l * y + 2 * s) * y + i;
      };
    var m = o;
    for (var y = 0; y < 8; y++) {
      var _ = b(m) - o;
      if (Math.abs(_) < 1e-6) return u(m);
      var v = f(m);
      if (Math.abs(v) < 1e-6) break;
      m -= _ / v;
    }
    var g = 0,
      S = 1;
    for (m = o; S - g > 1e-6;) b(m) < o ? g = m : S = m, m = (g + S) / 2;
    return u(m);
  }
  var it = /^(-?\d*\.?\d+(?:e[-+]?\d+)?)([a-z%]*)$/i,
    st = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
    G = /-?\d*\.?\d+(?:e[-+]?\d+)?/g;
  function oe(t, n, e) {
    var r = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : e;
    if (typeof t == "number" && typeof n == "number") return t + (n - t) * e;
    var o = String(t),
      i = String(n),
      s = it.exec(o),
      l = it.exec(i);
    if (s && l) {
      var u = s[2].toLowerCase(),
        f = l[2].toLowerCase();
      if (u === f || !u || !f) {
        var m = q(Number(s[1]), Number(l[1]), e);
        return ct(m) + (u || f);
      }
      return r < 1 ? t : n;
    }
    var a = st.exec(o),
      c = st.exec(i);
    if (a && c) return ie(a[1], c[1], e);
    var p = o.match(G),
      b = i.match(G);
    if (p && b && p.length === b.length) {
      var _u = o.split(G),
        _f = i.split(G);
      if (_u.length === _f.length && _u.every(function (m, g) {
        return m === _f[g];
      })) {
        var _m = "";
        for (var g = 0; g < _u.length; g++) if (_m += _u[g], g < p.length) {
          var S = p[g],
            y = b[g],
            _ = /^-?0\d/.test(S) || /^-?0\d/.test(y);
          _m += _ ? r < 1 ? S : y : ct(q(Number(S), Number(y), e));
        }
        return _m;
      }
    }
    return r < 1 ? t : n;
  }
  function q(t, n, e) {
    return t + (n - t) * e;
  }
  function ct(t) {
    return String(Math.round(t * 1e4) / 1e4);
  }
  function ie(t, n, e) {
    var r = at(t),
      o = at(n),
      i = function i(a) {
        return Math.round($(a / 255) * 255).toString(16).padStart(2, "0");
      },
      s = r.length === 4 || o.length === 4 ? 4 : 3;
    var l = "#";
    for (var a = 0; a < s; a++) {
      var _r$a, _o$a;
      l += i(q((_r$a = r[a]) !== null && _r$a !== void 0 ? _r$a : 255, (_o$a = o[a]) !== null && _o$a !== void 0 ? _o$a : 255, e));
    }
    return l;
  }
  function at(t) {
    var _t$match;
    return (t.length <= 4 ? t.split("").map(function (e) {
      return e + e;
    }) : (_t$match = t.match(/../g)) !== null && _t$match !== void 0 ? _t$match : []).map(function (e) {
      return parseInt(e, 16);
    });
  }
  function V(t, n, e) {
    var r = [],
      o = [],
      i = [];
    var s = null;
    for (var _i4 = 0, _arr = _toConsumableArray(t.attributes); _i4 < _arr.length; _i4++) {
      var _arr$_i = _arr[_i4],
        l = _arr$_i.name,
        a = _arr$_i.value;
      if (l === "sc-name" || l === "data-dc-tpl") continue;
      if (n === "dom") {
        var p = Vt(l),
          b = !p || p.kind === "css" || Kt(tt[t.localName] || t.localName);
        p && b && (p.kind === "css" ? $t(p.prop) : Zt(p.prop)) && i.push({
          kind: p.kind,
          prop: p.prop,
          getter: O(a)
        });
      }
      var c = l;
      if (c.startsWith(W) && (c = U(c.slice(W.length))), c === "hint-size") {
        s = a;
        continue;
      }
      if (c.startsWith("style-")) {
        o.push(e.pseudoClass(c.slice(6), a));
        continue;
      }
      n !== "dom" ? c.includes("-") && !(n === "x-import" && (c.startsWith("aria-") || c.startsWith("data-"))) && (c = U(c)) : c === "class" ? c = "className" : c === "for" ? c = "htmlFor" : c.startsWith("on") && (c = zt[c] || "on" + c[2].toUpperCase() + c.slice(3)), r.push([c, O(a)]);
    }
    return {
      propGetters: r,
      pseudoClasses: o,
      hintSize: s,
      kfTracks: i
    };
  }
  var se = new Set(["position", "left", "right", "top", "bottom", "inset", "width", "height", "z-index", "transform"]),
    lt = function lt(t) {
      return t.startsWith("--") ? t : t.replace(/[A-Z]/g, function (n) {
        return "-" + n.toLowerCase();
      });
    };
  function ut(t) {
    var n = typeof t == "string" ? et(t) : t != null && _typeof(t) == "object" ? t : null;
    if (!n) return;
    var e = {};
    for (var _i5 = 0, _Object$entries2 = Object.entries(n); _i5 < _Object$entries2.length; _i5++) {
      var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i5], 2),
        r = _Object$entries2$_i[0],
        o = _Object$entries2$_i[1];
      se.has(lt(r)) && (e[r] = o);
    }
    return Object.keys(e).length ? e : void 0;
  }
  function ce(t, n) {
    var e = document.createElement("template");
    e.innerHTML = Bt(t);
    var r = 0;
    (function s(l) {
      l.nodeType === Node.ELEMENT_NODE && l.setAttribute("data-dc-tpl", String(r++));
      var _iterator4 = _createForOfIteratorHelper(l.childNodes),
        _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var a = _step4.value;
          s(a);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    })(e.content);
    var o = D(e.content, n),
      i = function i(s, l) {
        return o.map(function (a, c) {
          return a(s || {}, l, c);
        });
      };
    return i.__annotated = e.innerHTML, i;
  }
  function D(t, n) {
    return _toConsumableArray(t.childNodes).map(function (e) {
      return ae(e, n);
    }).filter(function (e) {
      return e != null;
    });
  }
  function ae(t, n) {
    if (t.nodeType === Node.TEXT_NODE) return le(t);
    if (t.nodeType !== Node.ELEMENT_NODE) return null;
    var e = t,
      r = e.tagName.toLowerCase();
    return r === "sc-for" ? ue(e, n) : r === "sc-if" ? fe(e, n) : r === "x-import" ? pe(e, n) : r === "sc-helmet" ? n.helmet(e) : r === "dc-import" ? de(e, n) : Ee(e, n);
  }
  var ft = new Set();
  function dt(t, n) {
    var e = ((t === null || t === void 0 ? void 0 : t.__name) || "?") + "\0" + n;
    ft.has(e) || (ft.add(e), console.warn("[dc-runtime] " + ((t === null || t === void 0 ? void 0 : t.__name) || "template") + ": " + n));
  }
  function le(t) {
    var _t$nodeValue;
    var n = (_t$nodeValue = t.nodeValue) !== null && _t$nodeValue !== void 0 ? _t$nodeValue : "";
    if (!n.includes("{{")) return !n.trim() && !n.includes(" ") ? null : function () {
      return n;
    };
    var e = n.split(/\{\{([\s\S]+?)\}\}/g);
    return function (r, o, i) {
      return A.apply(void 0, [T().Fragment, {
        key: i
      }].concat(_toConsumableArray(e.map(function (s, l) {
        var _document$body;
        if (!(l & 1)) return s;
        var a = P(r, s);
        return a === void 0 ? o !== null && o !== void 0 && o.__streamingNow ? A("span", {
          key: l,
          className: "sc-interp sc-missing"
        }, s.trim()) : (_document$body = document.body) !== null && _document$body !== void 0 && _document$body.hasAttribute("data-dc-editor-on") ? A("span", {
          key: l,
          className: "sc-interp sc-unresolved"
        }, "{{ " + s.trim() + " }}") : (dt(o, "{{ " + s.trim() + " }} never resolved \u2014 rendered as empty"), null) : T().isValidElement(a) || Array.isArray(a) ? A(T().Fragment, {
          key: l
        }, a) : a === null || typeof a == "boolean" ? null : A("span", {
          key: l,
          className: "sc-interp"
        }, String(a));
      }))));
    };
  }
  function ue(t, n) {
    var e = O(t.getAttribute("list") || ""),
      r = t.getAttribute("as") || "item",
      o = parseInt(t.getAttribute("hint-placeholder-count") || "0", 10),
      i = D(t, n),
      s = t.getAttribute("list") || "";
    return function (l, a, c) {
      var p = e(l);
      return Array.isArray(p) || (a !== null && a !== void 0 && a.__streamingNow ? p = o > 0 ? Array(o).fill(void 0) : [] : (p != null && dt(a, 'sc-for list="' + s + '" is not an array (' + _typeof(p) + ")"), p = [])), A(T().Fragment, {
        key: c
      }, p.map(function (b, u) {
        var f = _objectSpread(_objectSpread({}, l), {}, _defineProperty(_defineProperty({}, r, b), "$index", u));
        return A(T().Fragment, {
          key: u
        }, i.map(function (m, g) {
          return m(f, a, g);
        }));
      }));
    };
  }
  function fe(t, n) {
    var e = O(t.getAttribute("value") || ""),
      r = t.getAttribute("hint-placeholder-val"),
      o = r != null ? O(r) : null,
      i = D(t, n);
    return function (s, l, a) {
      var c = e(s);
      return c === void 0 && o && l !== null && l !== void 0 && l.__streamingNow && (c = o(s)), c ? A(T().Fragment, {
        key: a
      }, i.map(function (p, b) {
        return p(s, l, b);
      })) : null;
    };
  }
  function de(t, n) {
    var e = t.getAttribute("name") || t.getAttribute("component") || "";
    t.removeAttribute("name"), t.removeAttribute("component");
    var r = t.getAttribute("data-dc-tpl"),
      o = t.getAttribute("style");
    t.removeAttribute("style");
    var i = o != null ? O(o) : null,
      _V = V(t, "dc-import", n),
      s = _V.propGetters,
      l = _V.hintSize,
      a = D(t, n);
    return function (c, p, b) {
      var u = {
        key: b,
        __hintSize: l,
        __tplId: r,
        __hostStyle: i ? ut(i(c)) : void 0
      };
      var _iterator5 = _createForOfIteratorHelper(s),
        _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var _step5$value = _slicedToArray(_step5.value, 2),
            f = _step5$value[0],
            m = _step5$value[1];
          var g = m(c);
          if (f === "dcProps") {
            g && _typeof(g) == "object" && Object.assign(u, g);
            continue;
          }
          u[f] = g;
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      return a.length && (u.children = a.map(function (f, m) {
        return f(c, p, m);
      })), A(n.component(e), u);
    };
  }
  function pe(t, n) {
    var e = O(t.getAttribute("component-from-global-scope") || ""),
      r = O(t.getAttribute("component") || t.getAttribute("name") || ""),
      o = t.getAttribute("from") || (t.getAttribute("component-from-global-scope") ? "" : t.getAttribute("src") || t.getAttribute("import") || ""),
      i = o.trim() ? o.trim().split(/\s+/) : [],
      s = i.length ? i[i.length - 1] : "",
      l = function l(_) {
        return /\.(jsx|tsx)(\?|#|$)/i.test(_) ? "jsx" : "js";
      },
      a = t.getAttribute("data-dc-tpl"),
      c = t.getAttribute("style");
    t.removeAttribute("style");
    var p = c != null ? O(c) : null,
      b = a != null || p != null,
      _V2 = V(t, "x-import", n),
      u = _V2.propGetters,
      f = _V2.hintSize,
      g = t.children.length > 0 || !!(t.textContent || "").trim() ? D(t, n) : [],
      S = o.includes("{{");
    if (i.length && !S) {
      var _;
      var _iterator6 = _createForOfIteratorHelper(i),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var v = _step6.value;
          _ = n.loadExternal(l(v), v, _);
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
    }
    var y = function y(_, v) {
      var x = _(v),
        d = x == null ? "" : String(x);
      return d.includes("{{") ? "" : d;
    };
    return function (_, v, x) {
      var d = y(e, _),
        h = d || y(r, _),
        w = !h || S ? null : d ? n.resolveExternalGlobal(s, d) : n.resolveExternal(s, h),
        E = p ? ut(p(_)) : void 0,
        k = b ? {
          key: x,
          className: "sc-host-x",
          "data-dc-tpl": a,
          style: E || {
            display: "contents"
          }
        } : null;
      if (!w) {
        var C = S ? "x-import `from` cannot contain {{ \u2026 }} \u2014 module URLs are resolved at parse time; use a literal URL" : n.resolveExternalError(s, h),
          N = n.placeholder({
            key: k ? void 0 : x,
            name: h,
            hintSize: f,
            error: C
          });
        return k ? A("div", k, N) : N;
      }
      var R = k ? {} : {
        key: x
      };
      var L = !1;
      var _iterator7 = _createForOfIteratorHelper(u),
        _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var _step7$value = _slicedToArray(_step7.value, 2),
            _C2 = _step7$value[0],
            _N = _step7$value[1];
          if (_C2 === "component" || _C2 === "componentFromGlobalScope" || _C2 === "from") continue;
          var j = _N(_);
          if (j === void 0 && (L = !0), _C2 === "dcProps") {
            j && _typeof(j) == "object" && Object.assign(R, j);
            continue;
          }
          R[_C2] = j;
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      if (L && v !== null && v !== void 0 && v.__htmlStreamingNow) {
        var _C = n.placeholder({
          key: k ? void 0 : x,
          name: h,
          hintSize: f,
          error: null
        });
        return k ? A("div", k, _C) : _C;
      }
      return g.length && (R.children = g.map(function (C, N) {
        return C(_, v, N);
      })), k ? A("div", k, A(w, R)) : A(w, R);
    };
  }
  function me(t) {
    var n = t.cloneNode(!0);
    var _iterator8 = _createForOfIteratorHelper(n.querySelectorAll("*")),
      _step8;
    try {
      for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
        var _o = _step8.value;
        for (; _o.attributes.length;) _o.removeAttribute(_o.attributes[0].name);
      }
    } catch (err) {
      _iterator8.e(err);
    } finally {
      _iterator8.f();
    }
    var e = n.innerHTML;
    var r = 5381;
    for (var o = 0; o < e.length; o++) r = (r << 5) + r + e.charCodeAt(o) | 0;
    return e.length + "." + (r >>> 0).toString(36);
  }
  var he = new Set("script style textarea option title select canvas iframe video audio".split(" ")),
    ge = ":not(" + _toConsumableArray(Dt).join(",") + ")",
    pt = new RegExp("-{0,2}[A-Za-z_][A-Za-z0-9_-]*", "y"),
    _e = /^(?:behavior|-moz-binding)$/i,
    mt = /[ \t\n\r\f]/;
  function be(t) {
    var n = "",
      e = 0,
      r = 0,
      o = !0;
    var i = t.length;
    for (; e < i;) {
      if (o) {
        var l = e;
        for (; l < i && mt.test(t[l]);) l++;
        if (t[l] === "/" && t[l + 1] === "*") {
          var c = t.indexOf("*/", l + 2),
            p = c < 0 ? i : c + 2;
          n += t.slice(e, p), e = p;
          continue;
        }
        o = !1, pt.lastIndex = l;
        var a = pt.exec(t);
        if (a) {
          var _c = l + a[0].length;
          for (;;) {
            for (; _c < i && mt.test(t[_c]);) _c++;
            if (t[_c] !== "/" || t[_c + 1] !== "*") break;
            var _p = t.indexOf("*/", _c + 2);
            _c = _p < 0 ? i : _p + 2;
          }
          if (t[_c] === ":") {
            var _p2 = Wt(a[0]);
            n += t.slice(e, l) + (_e.test(_p2) ? a[0] : _p2), e = l + a[0].length;
            continue;
          }
        }
      }
      var s = t[e];
      if (s === '"' || s === "'") {
        var _l = e + 1;
        for (; _l < i && t[_l] !== s;) _l += t[_l] === "\\" ? 2 : 1;
        n += t.slice(e, _l + 1), e = _l + 1;
        continue;
      }
      if (s === "/" && t[e + 1] === "*") {
        var _l2 = t.indexOf("*/", e + 2),
          _a = _l2 < 0 ? i : _l2 + 2;
        n += t.slice(e, _a), e = _a;
        continue;
      }
      if (s === "\\") {
        n += t.slice(e, e + 2), e += 2;
        continue;
      }
      s === "(" || s === "{" || s === "[" ? r++ : s === ")" || s === "}" || s === "]" ? r = Math.max(0, r - 1) : s === ";" && r === 0 && (o = !0), n += s, e++;
    }
    return n;
  }
  function ye(t, n) {
    return t == null ? void 0 : t + "\0" + n.join(";");
  }
  function we(t, n) {
    var e = ye(t, n);
    return function (r) {
      if (!r || r.__dcCss === e) return;
      r.__dcCss = e;
      var o = r.style,
        i = n.map(function (s) {
          return [s, o.getPropertyValue(s)];
        });
      o.cssText = t ? be(t) : "";
      for (var s = o.length; s-- > 0;) {
        var l = o[s];
        if (!o.getPropertyPriority(l)) continue;
        var a = o.getPropertyValue(l);
        a && o.setProperty(l, a), o.getPropertyPriority(l) && o.removeProperty(l);
      }
      var _iterator9 = _createForOfIteratorHelper(i),
        _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var _step9$value = _slicedToArray(_step9.value, 2),
            _s = _step9$value[0],
            _l3 = _step9$value[1];
          _l3 && o.setProperty(_s, _l3);
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
    };
  }
  function ve(t, n) {
    typeof t == "function" ? t(n) : t.current = n;
  }
  function ht(t, n, e, r) {
    var o = t.get(e);
    return o || (t.size >= n && t.delete(t.keys().next().value), t.set(e, o = r())), o;
  }
  var gt = new WeakMap();
  function xe() {
    var t = new Map();
    return function (n, e, r) {
      var o = (n == null ? "none" : "css:" + n) + "\0" + e.join(";"),
        i = function i() {
          return we(n, e);
        };
      if (r == null || typeof r != "function" && _typeof(r) != "object") return ht(t, 64, o, i);
      var s = gt.get(r);
      return s || gt.set(r, s = new Map()), ht(s, 1024, o, function () {
        var l = i();
        return function (a) {
          l(a), ve(r, a);
        };
      });
    };
  }
  function Ee(t, n) {
    var e = tt[t.localName] || t.localName,
      r = t.getAttribute("data-dc-tpl"),
      i = t.childNodes.length > 0 && !he.has(e) && t.querySelector(ge) === null ? "|" + me(t) : "",
      _V3 = V(t, "dom", n),
      s = _V3.propGetters,
      l = _V3.pseudoClasses,
      a = _V3.kfTracks,
      c = D(t, n),
      p = n.omelette ? null : xe();
    return function (b, u, f) {
      var m = {
        key: f + i,
        "data-dc-tpl": r
      };
      var g = null;
      var _iterator0 = _createForOfIteratorHelper(s),
        _step0;
      try {
        for (_iterator0.s(); !(_step0 = _iterator0.n()).done;) {
          var _step0$value = _slicedToArray(_step0.value, 2),
            _y2 = _step0$value[0],
            _2 = _step0$value[1];
          var _v = _2(b);
          _y2 === "style" && typeof _v == "string" && (g = _v, _v = et(_v)), (_y2 === "value" || _y2 === "checked") && _v === void 0 && (_v = _y2 === "checked" ? !1 : ""), m[_y2] = _v;
        }
      } catch (err) {
        _iterator0.e(err);
      } finally {
        _iterator0.f();
      }
      l.length && (m.className = [m.className].concat(_toConsumableArray(l)).filter(Boolean).join(" "));
      var S = [];
      if (a.length) {
        var y = n.keyframesPlayhead ? n.keyframesPlayhead() : 0;
        var _ = null;
        var _iterator1 = _createForOfIteratorHelper(a),
          _step1;
        try {
          for (_iterator1.s(); !(_step1 = _iterator1.n()).done;) {
            var v = _step1.value;
            var x = te(v.getter(b));
            if (!x) continue;
            var d = ee(x, y);
            if (v.kind === "css") S.push(v.prop), _ || (_ = m.style && _typeof(m.style) == "object" ? _objectSpread({}, m.style) : {}, m.style = _), _[v.prop.startsWith("--") ? v.prop : U(v.prop)] = d;else {
              var h = Yt(v.prop, d);
              h != null && (m[v.prop] = h);
            }
          }
        } catch (err) {
          _iterator1.e(err);
        } finally {
          _iterator1.f();
        }
      }
      if (p) {
        var _y = g == null && m.style && _typeof(m.style) == "object" ? Object.keys(m.style).map(lt) : S;
        m.ref = p(g, _y.sort(), m.ref);
      }
      return A.apply(void 0, [e, m].concat(_toConsumableArray(c.map(function (y, _) {
        return y(b, u, _);
      }))));
    };
  }
  var z = /*#__PURE__*/function () {
    function z(t) {
      _classCallCheck(this, z);
      M(this, "props"), M(this, "state", {}), M(this, "__host"), this.props = t || {};
    }
    return _createClass(z, [{
      key: "setState",
      value: function setState(t, n) {
        this.__host && this.__host.__setLogicState(t, n);
      }
    }, {
      key: "forceUpdate",
      value: function forceUpdate() {
        this.__host && this.__host.forceUpdate();
      }
    }, {
      key: "componentDidMount",
      value: function componentDidMount() {}
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate(t) {}
    }, {
      key: "componentWillUnmount",
      value: function componentWillUnmount() {}
    }, {
      key: "renderVals",
      value: function renderVals() {
        return {};
      }
    }]);
  }();
  function Se(t) {
    return new Function("DCLogic", "StreamableLogic", "React", t + "\n;return (typeof Component!==\"undefined\"&&Component)||undefined;")(z, z, T());
  }
  function ke(t, n) {
    if (!n) return !1;
    var e = Object.keys(t).filter(function (o) {
        return o !== "children";
      }),
      r = Object.keys(n).filter(function (o) {
        return o !== "children";
      });
    if (e.length !== r.length) return !1;
    var _iterator10 = _createForOfIteratorHelper(e),
      _step10;
    try {
      for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
        var o = _step10.value;
        if (t[o] !== n[o]) return !1;
      }
    } catch (err) {
      _iterator10.e(err);
    } finally {
      _iterator10.f();
    }
    return !0;
  }
  function F(_ref5) {
    var t = _ref5.name,
      n = _ref5.hintSize,
      e = _ref5.streaming,
      r = _ref5.error;
    var _split = (n || "100%,60px").split(","),
      _split2 = _slicedToArray(_split, 2),
      o = _split2[0],
      i = _split2[1];
    return A("div", {
      className: "sc-placeholder" + (e ? " sc-streaming" : ""),
      style: {
        width: o.trim(),
        height: i && i.trim()
      },
      title: t
    }, r ? A("div", {
      className: "sc-placeholder-error"
    }, (t ? t + ": " : "") + r) : null);
  }
  function Ae(t) {
    if (!t) return;
    var _t$split = t.split(","),
      _t$split2 = _slicedToArray(_t$split, 2),
      n = _t$split2[0],
      e = _t$split2[1];
    return {
      minWidth: n.trim(),
      minHeight: e && e.trim()
    };
  }
  function Ce(t, n) {
    var e = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};
    var r = T(),
      o = r.createContext([]);
    var i = /*#__PURE__*/function (_r$Component) {
      function i(c) {
        var _this;
        _classCallCheck(this, i);
        _this = _callSuper(this, i, [c]), M(_assertThisInitialized(_this), "__name"), M(_assertThisInitialized(_this), "__sub"), M(_assertThisInitialized(_this), "__needsDidMount", !1), M(_assertThisInitialized(_this), "__streamingNow", !1), M(_assertThisInitialized(_this), "__htmlStreamingNow", !1), M(_assertThisInitialized(_this), "__failedLogic", null), M(_assertThisInitialized(_this), "__failedUserProps", null), M(_assertThisInitialized(_this), "__failedVer", -1), M(_assertThisInitialized(_this), "__ctorError", null), M(_assertThisInitialized(_this), "logic"), _this.__name = c.__name, _this.state = {
          __v: 0,
          __err: null
        }, _this.__sub = function () {
          _this.state.__err && _this.setState({
            __err: null
          }), _this.forceUpdate();
        }, _this.__makeLogic(t.get(_this.__name).Logic, null), n(_this.__name);
        return _this;
      }
      _inherits(i, _r$Component);
      return _createClass(i, [{
        key: "componentDidCatch",
        value: function componentDidCatch(c, p) {
          console.error("[dc-runtime] render error in <" + this.__name + ">:", c, (p === null || p === void 0 ? void 0 : p.componentStack) || "");
        }
      }, {
        key: "__makeLogic",
        value: function __makeLogic(c, p) {
          var b = c || z;
          try {
            this.logic = new b(this.__userProps()), this.__failedLogic = null, this.__failedUserProps = null, this.__ctorError = null;
          } catch (u) {
            console.error(u), this.__failedLogic = c, this.__failedUserProps = this.__userProps(), this.__failedVer = t.get(this.__name).ver, this.__ctorError = this.__name + ": " + (u instanceof Error && u.message ? u.message : String(u)), this.logic = new z(this.__userProps());
          }
          this.logic.__host = this, p && (this.logic.state = _objectSpread(_objectSpread({}, this.logic.state || {}), p));
        }
      }, {
        key: "__userProps",
        value: function __userProps() {
          var _this$props = this.props,
            c = _this$props.__name,
            p = _this$props.__hintSize,
            b = _this$props.__tplId,
            u = _this$props.__hostStyle,
            f = _objectWithoutProperties(_this$props, _excluded);
          return f;
        }
      }, {
        key: "__setLogicState",
        value: function __setLogicState(c, p) {
          var b = this.logic.state,
            u = typeof c == "function" ? c(b) : c;
          this.logic.state = _objectSpread(_objectSpread({}, b), u), this.setState(function (f) {
            return {
              __v: f.__v + 1
            };
          }, p);
        }
      }, {
        key: "__reconcileLogic",
        value: function __reconcileLogic() {
          var c = t.get(this.__name),
            p = c.Logic,
            b = this.logic.constructor;
          if (!(p === b || !p && b === z || p === this.__failedLogic && c.ver === this.__failedVer && ke(this.__userProps(), this.__failedUserProps))) {
            if (!this.__needsDidMount) try {
              this.logic.componentWillUnmount();
            } catch (u) {
              console.error(u);
            }
            this.__makeLogic(p, this.logic.state), this.__needsDidMount = !0;
          }
        }
      }, {
        key: "componentDidMount",
        value: function componentDidMount() {
          t.get(this.__name).subs.add(this.__sub);
          try {
            this.logic.componentDidMount();
          } catch (c) {
            console.error(c);
          }
        }
      }, {
        key: "componentDidUpdate",
        value: function componentDidUpdate(c) {
          if (this.logic.props = this.__userProps(), this.__needsDidMount) {
            if (this.state.__err || !t.get(this.__name).tpl) return;
            this.__needsDidMount = !1;
            try {
              this.logic.componentDidMount();
            } catch (p) {
              console.error(p);
            }
          } else try {
            this.logic.componentDidUpdate(c);
          } catch (p) {
            console.error(p);
          }
        }
      }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          if (t.get(this.__name).subs.delete(this.__sub), !this.__needsDidMount) try {
            this.logic.componentWillUnmount();
          } catch (c) {
            console.error(c);
          }
        }
      }, {
        key: "render",
        value: function render() {
          e(this.__name);
          var c = t.get(this.__name),
            p = "sc-host" + (c.htmlStreaming ? " sc-streaming-html" : "") + (c.jsStreaming ? " sc-streaming-js" : ""),
            b = c.htmlStreaming ? Ae(this.props.__hintSize) : void 0,
            u = this.props.__hostStyle || b ? _objectSpread(_objectSpread({}, b || {}), this.props.__hostStyle || {}) : void 0,
            f = {
              className: p,
              style: u,
              "data-sc-name": this.__name,
              "data-dc-tpl": this.props.__tplId
            },
            m = Array.isArray(this.context) ? this.context : [];
          if (m.includes(this.__name)) {
            var _ = [].concat(_toConsumableArray(m.slice(m.indexOf(this.__name))), [this.__name]).join(" \u2192 ");
            return A("div", _objectSpread(_objectSpread({}, f), {}, {
              className: p + " sc-has-error"
            }), A(F, {
              name: this.__name,
              hintSize: this.props.__hintSize,
              error: "circular import: " + _
            }));
          }
          if (this.state.__err) return A("div", _objectSpread(_objectSpread({}, f), {}, {
            className: p + " sc-has-error"
          }), A("div", {
            className: "sc-logic-error",
            "data-omelette-chrome": ""
          }, this.__name + ": " + this.state.__err), A(F, {
            name: this.__name,
            hintSize: this.props.__hintSize,
            error: this.state.__err
          }));
          if (this.__reconcileLogic(), !c.tpl) return A("div", f, A(F, {
            name: this.__name,
            hintSize: this.props.__hintSize
          }));
          var g = this.__userProps();
          this.logic.props = g;
          var S = g,
            y = c.logicError || this.__ctorError;
          try {
            S = _objectSpread(_objectSpread({}, g), this.logic.renderVals() || {});
          } catch (_) {
            console.error(_), y = this.__name + ".renderVals(): " + (_ instanceof Error && _.message ? _.message : String(_));
          }
          return this.__streamingNow = !!(c.htmlStreaming || c.jsStreaming), this.__htmlStreamingNow = !!c.htmlStreaming, A("div", _objectSpread(_objectSpread({}, f), {}, {
            className: p + (y ? " sc-has-error" : "")
          }), y && A("div", {
            className: "sc-logic-error",
            "data-omelette-chrome": ""
          }, y), A(o.Provider, {
            value: [].concat(_toConsumableArray(m), [this.__name])
          }, c.tpl(S, this)));
        }
      }], [{
        key: "getDerivedStateFromError",
        value: function getDerivedStateFromError(c) {
          return {
            __err: c instanceof Error && c.message ? c.message : String(c)
          };
        }
      }]);
    }(r.Component);
    M(i, "contextType", o);
    var s = new Map();
    function l(a) {
      var c = s.get(a);
      if (c) return c;
      function p(b) {
        var _r$useState3 = r.useState(0),
          _r$useState4 = _slicedToArray(_r$useState3, 2),
          u = _r$useState4[1];
        return r.useEffect(function () {
          var f = function f() {
            return u(function (m) {
              return m + 1;
            });
          };
          return t.get(a).subs.add(f), function () {
            t.get(a).subs.delete(f);
          };
        }, []), n(a), A(i, _objectSpread(_objectSpread({}, b), {}, {
          __name: a
        }));
      }
      return p.displayName = a, s.set(a, p), p;
    }
    return {
      getDC: l,
      StreamableComponent: i
    };
  }
  function H(t) {
    var n = window.__resourceBlobs,
      e = n ? n[t.split("#")[0]] : void 0;
    return e instanceof Blob ? e : null;
  }
  var Ne = "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
    Re = "sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z",
    Le = "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js",
    Me = "sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1",
    Te = "https://cdn.jsdelivr.net/npm/@babel/standalone@7.29.0/babel.min.js",
    Oe = "sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y";
  function K(t, n) {
    var e = window.__resources,
      r = e ? e[t] : void 0;
    return typeof r == "string" && r ? {
      src: r
    } : {
      src: t,
      integrity: n
    };
  }
  var _t = function _t(t) {
    return !t.includes(".") && t.includes("-");
  };
  function Z(t) {
    return typeof t == "function" ? !je(t) : _typeof(t) == "object" && t !== null && _typeof(t.$$typeof) == "symbol";
  }
  function J(t, n) {
    var e = t;
    var _iterator11 = _createForOfIteratorHelper(n.split(".")),
      _step11;
    try {
      for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
        var r = _step11.value;
        if (e == null) return;
        e = e[r];
      }
    } catch (err) {
      _iterator11.e(err);
    } finally {
      _iterator11.f();
    }
    return e;
  }
  var bt = 50,
    yt = 3e4;
  function Pe(t) {
    var n = new Map();
    var e = null;
    var r = new Map(),
      o = new Set();
    function i() {
      if (window.Babel) return Promise.resolve();
      if (e) return e;
      var u = K(Te, Oe);
      return e = new Promise(function (f, m) {
        var g = document.createElement("script");
        g.src = u.src, u.integrity && (g.integrity = u.integrity, g.crossOrigin = "anonymous"), g.onload = function () {
          return f();
        }, g.onerror = m, document.head.appendChild(g);
      }), e;
    }
    var s = new Map();
    function l(u, f, m) {
      var g = s.get(f);
      if (g) return g;
      n.set(f, null), console.info("[dc-runtime] x-import: loading", f, "(" + u + ")");
      var y = Promise.all([u === "jsx" ? i() : Promise.resolve(), m !== null && m !== void 0 ? m : Promise.resolve()]).then(function () {
        var _ = H(f);
        return _ ? _.text() : fetch(f).then(function (v) {
          if (!v.ok) throw new Error("HTTP " + v.status);
          return v.text();
        });
      }).then(function (_) {
        var v = u === "jsx" ? window.Babel.transform(_, {
            filename: f,
            presets: ["react", "typescript"]
          }).code : _,
          x = {
            exports: {}
          },
          d = new Set(Object.keys(window));
        new Function("React", "module", "exports", "require", v)(T(), x, x.exports, function () {
          return {};
        });
        var h = {};
        for (var _i6 = 0, _Object$keys2 = Object.keys(window); _i6 < _Object$keys2.length; _i6++) {
          var w = _Object$keys2[_i6];
          !d.has(w) && typeof window[w] == "function" && (h[w] = window[w]);
        }
        n.set(f, {
          mod: x.exports,
          globals: h
        }), console.info("[dc-runtime] x-import: loaded", f, "\u2014 exports:", Object.keys(x.exports), "window globals:", Object.keys(h)), t();
      }).catch(function (_) {
        n.set(f, {
          mod: {},
          globals: {},
          error: "failed to load: " + (_ instanceof Error && _.message ? _.message : String(_))
        }), console.error("[dc-runtime] x-import: FAILED to load", f, "(" + u + ")", _), t();
      });
      return s.set(f, y), y;
    }
    function a(u, f) {
      var m = n.get(u);
      if (!m) return null;
      var g = m.mod,
        S = m.globals,
        y = g && g[f] || S && S[f] || (typeof window === "undefined" ? "undefined" : _typeof(window)) < "u" && window[f] || g && g.default;
      if (typeof y == "function") return y;
      var _ = u + "\0" + f;
      return r.has(_) || (r.set(_, m.error || 'no export named "' + f + '" (has: ' + Object.keys(g).join(", ") + ")"), console.error("[dc-runtime] x-import: module", u, "loaded but has no component named", JSON.stringify(f), "\u2014 available exports:", Object.keys(g), "window globals:", Object.keys(S), ". The module must `module.exports = {" + f + "}` or set `window." + f + "`.")), null;
    }
    function c(u) {
      if (o.has(u)) return;
      o.add(u);
      var f = Date.now(),
        m = _t(u),
        _g = function g() {
          if (m ? customElements.get(u) : Z(J(window, u))) {
            o.delete(u), t();
            return;
          }
          if (Date.now() - f >= yt) {
            console.warn("[dc-runtime] x-import: global", JSON.stringify(u), "never appeared on window after " + yt + "ms");
            return;
          }
          setTimeout(_g, bt);
        };
      setTimeout(_g, bt);
    }
    function p(u, f) {
      var _g$globals$f;
      var m = _t(f);
      if (!u) {
        if (m) return customElements.get(f) ? f : (c(f), null);
        var _ = J(window, f);
        return Z(_) ? _ : (c(f), null);
      }
      var g = n.get(u);
      if (!g) return null;
      if (m && customElements.get(f)) return f;
      var S = (_g$globals$f = g.globals[f]) !== null && _g$globals$f !== void 0 ? _g$globals$f : J(window, f);
      if (Z(S)) return S;
      if (f.includes(".")) return null;
      var y = u + "\0global\0" + f;
      return r.has(y) || (r.set(y, null), m && !customElements.get(f) && console.warn("[dc-runtime] x-import:", u, "loaded but no custom element", JSON.stringify(f), "is registered and window." + f + " is not a function \u2014 rendering <" + f + "> as an unknown element.")), f;
    }
    function b(u, f) {
      var m = n.get(u);
      return m !== null && m !== void 0 && m.error ? m.error : r.get(u + "\0" + f) || null;
    }
    return {
      load: l,
      resolve: a,
      resolveGlobal: p,
      getError: b
    };
  }
  function je(t) {
    try {
      return typeof t == "function" && (typeof HTMLElement === "undefined" ? "undefined" : _typeof(HTMLElement)) < "u" && t.prototype instanceof HTMLElement;
    } catch (_unused7) {
      return !1;
    }
  }
  var De = ".fx{display:flex}.col{display:flex;flex-direction:column}.grid{display:grid}.ac{align-items:center}.jc{justify-content:center}.jb{justify-content:space-between}.f1{flex:1}.noshrink{flex-shrink:0}.wrap{flex-wrap:wrap}.fw5{font-weight:500}.fw6{font-weight:600}.fw7{font-weight:700}.fw8{font-weight:800}.fs11{font-size:11px}.fs12{font-size:12px}.fs13{font-size:13px}.fs14{font-size:14px}.fs15{font-size:15px}.fs16{font-size:16px}.fs20{font-size:20px}.fs22{font-size:22px}.upper{text-transform:uppercase}.tc{text-align:center}.nowrap{white-space:nowrap}.gap8{gap:8px}.gap10{gap:10px}.gap12{gap:12px}.gap16{gap:16px}.gap24{gap:24px}.m0{margin:0}.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}.posrel{position:relative}.posabs{position:absolute}.round{border-radius:50%}.ohide{overflow:hidden}.bbox{box-sizing:border-box}.pointer{cursor:pointer}.w100{width:100%}.b0{border:none}",
    ze = /<meta\b[^>]*\bname\s*=\s*["']design_doc_mode["'][^>]*\b(?:content|value)\s*=\s*["'](\w+)["']/i,
    Ie = "#ededeb",
    Ue = "#171717",
    Ge = "#f0eee6",
    Fe = "#2e2c26";
  function Be(t, n) {
    var e = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var r = new Set(),
      o = new Map();
    var i = null,
      s = null,
      l = "light";
    try {
      var _t$defaultView$locati, _t$defaultView;
      var u = t.documentElement.dataset.theme;
      l = u === "dark" || u === "light" ? u : new URLSearchParams((_t$defaultView$locati = (_t$defaultView = t.defaultView) === null || _t$defaultView === void 0 ? void 0 : _t$defaultView.location.search) !== null && _t$defaultView$locati !== void 0 ? _t$defaultView$locati : "").get("theme") === "dark" ? "dark" : "light";
    } catch (_unused8) {}
    function a() {
      if (!s) return;
      var u = e.omelette ? l === "dark" ? Fe : Ge : l === "dark" ? Ue : Ie;
      s.textContent = "html,body{background:".concat(u, "}#dc-root>.sc-host{position:relative}");
    }
    function c(u) {
      if (window.parent !== window) try {
        window.parent.postMessage({
          type: "__dc_design_mode",
          mode: u
        }, "*");
      } catch (_unused9) {}
    }
    function p(u) {
      var _s2;
      u !== i && (i = u, c(u), u === "canvas" ? (t.documentElement.setAttribute("data-dc-canvas", ""), s = t.createElement("style"), s.setAttribute("data-dc-canvas", ""), a(), t.head.appendChild(s)) : (t.documentElement.removeAttribute("data-dc-canvas"), (_s2 = s) !== null && _s2 !== void 0 && _s2.remove(), s = null));
    }
    window.addEventListener("message", function (u) {
      var f = u.data && u.data.type;
      if (f === "__dc_theme") {
        var m = u.data.theme;
        (m === "light" || m === "dark") && (l = m, a());
        return;
      }
      !i || f !== "__dc_probe" || c(i);
    });
    function b(u) {
      var _u$parentNode;
      var f = _toConsumableArray(u.children),
        m = u.nextSibling != null || ((_u$parentNode = u.parentNode) === null || _u$parentNode === void 0 ? void 0 : _u$parentNode.nextSibling) != null;
      if (u.hasAttribute("data-dc-atomics") && !r.has("__dc-atomics")) {
        r.add("__dc-atomics");
        var g = t.createElement("style");
        g.id = "__dc-atomics", g.textContent = De, t.head.appendChild(g);
      }
      return function (g, S) {
        var y = S && S.__name || "",
          _ = !!(y && n(y));
        var _loop = function _loop() {
            var x = f[v],
              d = x.tagName,
              h = _ && !m && v === f.length - 1;
            if (d === "SCRIPT") {
              if (h) return 0; // continue
              var w = "SCRIPT|" + (x.getAttribute("src") || x.textContent || "");
              if (r.has(w)) return 0; // continue
              r.add(w);
              var E = t.createElement("script");
              for (var _i7 = 0, _arr2 = _toConsumableArray(x.attributes); _i7 < _arr2.length; _i7++) {
                var _arr2$_i = _arr2[_i7],
                  k = _arr2$_i.name,
                  R = _arr2$_i.value;
                E.setAttribute(k, R);
              }
              x.textContent && (E.textContent = x.textContent), t.head.appendChild(E);
            } else if (d === "LINK" || d === "META") {
              if (h) return 0; // continue
              var _w = d + "|" + (x.getAttribute("href") || x.getAttribute("src") || x.outerHTML);
              if (r.has(_w)) return 0; // continue
              if (r.add(_w), d === "LINK") {
                var _E = (x.getAttribute("rel") || "").toLowerCase().split(/\s+/),
                  _k = (x.getAttribute("href") || "").trim(),
                  _R = window.__resources,
                  L = _R && _E.includes("stylesheet") && !_E.includes("alternate") ? _R[_k] : void 0,
                  C = typeof L == "string" && L ? H(L) : null;
                if (C) {
                  var N = t.createElement("style");
                  x.hasAttribute("disabled") ? N.setAttribute("media", "not all") : x.getAttribute("media") && N.setAttribute("media", x.getAttribute("media")), x.getAttribute("title") && N.setAttribute("title", x.getAttribute("title")), C.text().then(function (j) {
                    N.textContent = j;
                  }), t.head.appendChild(N);
                  return 0; // continue
                }
              }
              t.head.appendChild(x.cloneNode(!0));
            } else {
              var _w2 = y + "|" + v;
              var _E2 = o.get(_w2);
              (!_E2 || _E2.tagName !== d) && (_E2 && _E2.remove(), _E2 = t.createElement(d.toLowerCase()), o.set(_w2, _E2), t.head.appendChild(_E2));
              for (var _i8 = 0, _arr3 = _toConsumableArray(x.attributes); _i8 < _arr3.length; _i8++) {
                var _arr3$_i = _arr3[_i8],
                  _k2 = _arr3$_i.name,
                  _R2 = _arr3$_i.value;
                _E2.getAttribute(_k2) !== _R2 && _E2.setAttribute(_k2, _R2);
              }
              _E2.textContent !== x.textContent && (_E2.textContent = x.textContent);
            }
          },
          _ret;
        for (var v = 0; v < f.length; v++) {
          _ret = _loop();
          if (_ret === 0) continue;
        }
        return null;
      };
    }
    return {
      compile: b,
      setDesignDocMode: p
    };
  }
  function wt(t, n) {
    var _t2;
    if (t[n] !== "u" && t[n] !== "U" || t.slice(n, n + 4).toLowerCase() !== "url(" || /[a-z0-9_-]/i.test((_t2 = t[n - 1]) !== null && _t2 !== void 0 ? _t2 : "")) return -1;
    var e = n + 4;
    for (; e < t.length && /\s/.test(t[e]);) e++;
    if (t[e] === '"' || t[e] === "'") return -1;
    for (; e < t.length && t[e] !== ")";) t[e] === "\\" && e++, e++;
    return e < t.length ? e + 1 : t.length;
  }
  function We(t) {
    var n = "",
      e = "";
    for (var r = 0; r < t.length; r++) {
      var o = t[r];
      if (e) {
        if (o === "\\") {
          var _t3;
          n += o + ((_t3 = t[r + 1]) !== null && _t3 !== void 0 ? _t3 : ""), r++;
          continue;
        }
        o === e && (e = ""), n += o;
      } else if (o === "'" || o === '"') e = o, n += o;else if (o === "/" && t[r + 1] === "*") {
        var i = t.indexOf("*/", r + 2);
        r = i === -1 ? t.length : i + 1, n += " ";
      } else {
        var _i9 = wt(t, r);
        _i9 === -1 ? n += o : (n += t.slice(r, _i9), r = _i9 - 1);
      }
    }
    return n;
  }
  function $e(t) {
    t = We(t);
    var n = [];
    var e = 0,
      r = 0,
      o = "";
    for (var i = 0; i < t.length; i++) {
      var s = t[i];
      if (o) s === "\\" ? i++ : s === o && (o = "");else if (s === "'" || s === '"') o = s;else if (s === "(") r++;else if (s === ")") r = Math.max(0, r - 1);else if (s === ";" && r === 0) n.push(t.slice(e, i)), e = i + 1;else {
        var l = wt(t, i);
        l !== -1 && (i = l - 1);
      }
    }
    return n.push(t.slice(e)), n.map(function (i) {
      return i.trim();
    }).filter(Boolean).map(function (i) {
      return /!\s*important$/i.test(i) ? i : i + " !important";
    }).join(";");
  }
  function qe(t) {
    var n = null;
    var e = new Map();
    var r = 0;
    return function (o, i) {
      var s = o + "|" + i,
        l = e.get(s);
      if (l) return l;
      n || (n = t.createElement("style"), t.head.appendChild(n));
      var a = "scp" + (r++).toString(36),
        c = o === "before" || o === "after",
        p = c ? "." + a + "::" + o : "." + a + ":" + o;
      return n.sheet.insertRule(p + "{" + (c ? i : $e(i)) + "}", n.sheet.cssRules.length), e.set(s, a), a;
    };
  }
  function Ve() {
    var t = Object.create(null);
    function n(r) {
      return t[r] || (t[r] = {
        html: "",
        tpl: null,
        Logic: null,
        jsStreaming: !1,
        htmlStreaming: !1,
        ver: 0,
        subs: new Set(),
        fetched: !1
      });
    }
    function e(r) {
      var o = n(r);
      o.ver++;
      var _iterator12 = _createForOfIteratorHelper(o.subs),
        _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
          var i = _step12.value;
          i();
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
    }
    return {
      entries: t,
      get: n,
      bump: e,
      bumpAll: function bumpAll() {
        for (var r in t) e(r);
      }
    };
  }
  var He = ".";
  function Ke() {
    var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
    var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var e = n.omelette === !0,
      r = Ve(),
      o = qe(t),
      i = Be(t, function (d) {
        return r.get(d).htmlStreaming;
      }, {
        omelette: e
      }),
      s = Pe(function () {
        return r.bumpAll();
      }),
      l = Ce(r, b, m),
      a = {
        component: function component(d) {
          return l.getDC(d);
        },
        placeholder: function placeholder(d) {
          return A(F, d);
        },
        helmet: function helmet(d) {
          return i.compile(d);
        },
        loadExternal: function loadExternal(d, h, w) {
          return s.load(d, h, w);
        },
        resolveExternal: function resolveExternal(d, h) {
          return s.resolve(d, h);
        },
        resolveExternalGlobal: function resolveExternalGlobal(d, h) {
          return s.resolveGlobal(d, h);
        },
        resolveExternalError: function resolveExternalError(d, h) {
          return s.getError(d, h);
        },
        pseudoClass: o,
        keyframesPlayhead: function keyframesPlayhead() {
          return c;
        },
        omelette: e
      };
    var c = 0;
    function p(d) {
      var h = typeof d == "number" && Number.isFinite(d) ? Math.max(0, d) : 0;
      h !== c && (c = h, r.bumpAll());
    }
    function b(d) {
      var h = r.get(d);
      if (h.fetched) return;
      h.fetched = !0;
      var w = He + "/" + encodeURIComponent(d) + ".dc.html",
        E = window.__resources,
        k = E ? E[w] : void 0,
        R = typeof k == "string" && k ? k : w,
        L = H(R);
      (L ? L.text() : fetch(R).then(function (C) {
        return C.ok ? C.text() : (console.error('[dc-runtime] sibling fetch for "' + d + '" failed:', w, "returned", C.status, "\u2014 the reference renders as an empty placeholder."), "");
      })).then(function (C) {
        if (!C) return;
        var N = X(C);
        if (!N) {
          console.error('[dc-runtime] sibling fetch for "' + d + '":', w, "has no <x-dc> block \u2014 not a Design Component.");
          return;
        }
        N.props && (h.propsMeta = N.props), N.preview && (h.preview = N.preview), N.template && !h.html && g(d, N.template), N.js && !h.Logic && S(d, N.js);
      }).catch(function (C) {
        return console.error('[dc-runtime] sibling fetch for "' + d + '" threw:', w, C);
      });
    }
    var u = null;
    function f(d, h) {
      h.tplStale = !1;
      try {
        h.tpl = ce(h.html, a);
      } catch (w) {
        console.error("[dc-runtime] template compile FAILED for", d, w);
      }
    }
    function m(d) {
      var h = r.get(d);
      h.tplStale && f(d, h);
    }
    function g(d, h) {
      var w = r.get(d);
      if (w.html = h, d === u) {
        var _ze$exec$, _ze$exec;
        var E = (_ze$exec$ = (_ze$exec = ze.exec(h)) === null || _ze$exec === void 0 ? void 0 : _ze$exec[1]) !== null && _ze$exec$ !== void 0 ? _ze$exec$ : null;
        (E || !w.htmlStreaming) && i.setDesignDocMode(E);
      }
      w.subs.size === 0 ? w.tplStale = !0 : f(d, w), r.bump(d);
    }
    function S(d, h) {
      var w = r.get(d),
        E = w.jsSeq = (w.jsSeq || 0) + 1;
      try {
        var k = Se(h);
        if (w.jsSeq !== E) return;
        typeof k != "function" ? w.logicError = d + ".dc.html: <script data-dc-script> must define `class Component extends DCLogic`" : (w.logicError = null, w.Logic = k);
      } catch (k) {
        if (w.jsSeq !== E) return;
        console.error("[dc-runtime] logic class eval FAILED for", d, "\u2014 the template renders with props only.", k), w.logicError = d + ": " + (k instanceof Error && k.message ? k.message : String(k));
      }
      r.bump(d);
    }
    function y(d, h, w) {
      var E = r.get(d);
      h === "html" ? E.htmlStreaming = !!w : E.jsStreaming = !!w;
      var k = !1;
      for (var R in r.entries) {
        var L = r.entries[R];
        if (L && (L.htmlStreaming || L.jsStreaming)) {
          k = !0;
          break;
        }
      }
      t.documentElement.classList.toggle("sc-dc-streaming", k), r.bump(d);
    }
    function _(d, h, w, E) {
      if (E && (r.get(d).fetched = !0), h === "html") y(d, "html", !!E), g(d, w);else if (h === "js") y(d, "js", !!E), E || S(d, w);else if (h === "props") {
        var _B3 = B(w),
          k = _B3.props,
          R = _B3.preview,
          L = r.get(d);
        L.propsMeta = k !== null && k !== void 0 ? k : void 0, L.preview = R, r.bump(d);
      }
    }
    function v(d, h) {
      r.get(d).propOverrides = h && _typeof(h) == "object" ? _objectSpread({}, h) : null, r.bump(d);
    }
    function x(d, h) {
      if (!h) return;
      var w = r.get(d);
      h.props && (w.propsMeta = h.props), h.preview && (w.preview = h.preview), h.template && g(d, h.template), h.js && S(d, h.js);
    }
    return {
      registry: r,
      getDC: l.getDC,
      updateHtml: g,
      updateJs: S,
      dcUpdate: _,
      setProps: v,
      seekKeyframes: p,
      keyframesPlayhead: function keyframesPlayhead() {
        return c;
      },
      adoptParsed: x,
      setRootName: function setRootName(d) {
        u = d;
      },
      markFetched: function markFetched(d) {
        r.get(d).fetched = !0;
      },
      annotatedTemplate: function annotatedTemplate(d) {
        m(d);
        var h = r.get(d);
        return h.tpl && h.tpl.__annotated || null;
      },
      templateSource: function templateSource(d) {
        return r.get(d).html || null;
      },
      StreamableLogic: z
    };
  }
  function Ze() {
    var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6e4;
    var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Date.now;
    var e = new Map(),
      r = function r(o) {
        var i = e.get(o);
        return i === void 0 ? !1 : n() - i > t ? (e.delete(o), !1) : !0;
      };
    return {
      push: function push(o, i, s) {
        s !== "dc-model" && (i ? e.set(o, n()) : e.delete(o));
      },
      live: function live(o) {
        if (o !== void 0) return r(o);
        for (var _i0 = 0, _arr4 = _toConsumableArray(e.keys()); _i0 < _arr4.length; _i0++) {
          var i = _arr4[_i0];
          if (r(i)) return !0;
        }
        return !1;
      }
    };
  }
  function Je() {
    var t = document.createElement("style");
    t.textContent = "x-dc{display:none!important}", document.head.appendChild(t);
  }
  function vt(t, n) {
    return new Promise(function (e, r) {
      var o = document.createElement("script");
      o.src = t, n && (o.integrity = n, o.crossOrigin = "anonymous"), o.async = !1, o.onload = function () {
        return e();
      }, o.onerror = function () {
        return r(new Error("failed to load ".concat(t)));
      }, document.head.appendChild(o);
    });
  }
  function Xe() {
    var t = window;
    if (t.React && t.ReactDOM) return Promise.resolve();
    var n = K(Ne, Re),
      e = K(Le, Me);
    return Promise.all([vt(n.src, n.integrity), vt(e.src, e.integrity)]).then(function () {});
  }
  function Ye() {
    var t = window.__dcRuntimeMode === "omelette",
      n = Ke(document, {
        omelette: t
      });
    var e = "Root",
      r = !1;
    var o = document.createElement("style");
    o.textContent = Ct, document.head.prepend(o);
    var i = function i() {
        if (window.parent === window) return;
        var a = n.registry.entries[e];
        try {
          window.parent.postMessage({
            type: "__dc_booted",
            rootName: e,
            mounted: r,
            propsMeta: a && a.propsMeta || null,
            preview: a && a.preview || null
          }, "*");
        } catch (_unused0) {}
      },
      s = Ze(),
      l = {
        __dcUpdate: function __dcUpdate(a, c, p, b, u) {
          s.push(a, b, u), n.dcUpdate(a, c, p, b), a === e && !b && c === "props" && i();
        },
        __dcStreaming: function __dcStreaming(a) {
          return s.live(a);
        },
        __dcSetProps: function __dcSetProps(a, c) {
          return n.setProps(a, c);
        },
        __dcSeekKeyframes: function __dcSeekKeyframes(a) {
          return n.seekKeyframes(a);
        },
        __dcKeyframesPlayhead: function __dcKeyframesPlayhead() {
          return n.keyframesPlayhead();
        },
        __dcRootName: function __dcRootName() {
          return e;
        },
        __dcAnnotatedTemplate: function __dcAnnotatedTemplate(a) {
          return n.annotatedTemplate(a);
        },
        __dcTemplateSource: function __dcTemplateSource(a) {
          return n.templateSource(a);
        },
        __dcBoot: function __dcBoot() {
          var a = Mt(n, document);
          a != null && (e = a, r = !0), i();
        },
        __dcRegistry: n.registry.entries,
        getDC: function getDC(a) {
          return n.getDC(a);
        },
        DCLogic: n.StreamableLogic,
        StreamableLogic: n.StreamableLogic
      };
    Object.assign(window, l), window.__dcContentKeyed = !0, document.readyState !== "loading" ? l.__dcBoot() : document.addEventListener("DOMContentLoaded", function () {
      return l.__dcBoot();
    });
  }
  Je(), Xe().then(Ye).catch(function (t) {
    throw console.error("[dc] failed to load React or boot:", t), t;
  });
})();
