(function (console, $global) { "use strict";
var $hxClasses = {},$estr = function() { return js_Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var App = function() {
};
$hxClasses["App"] = App;
App.__name__ = ["App"];
App.j = function(r) {
	return js.JQuery(r);
};
App.main = function() {
	window._ = new App();
};
App.roundTo = function(n,r) {
	return Math.round(n * Math.pow(10,r)) / Math.pow(10,r);
};
App.prototype = {
	getCart: function() {
		return new Cart();
	}
	,getTagger: function(cid) {
		return new Tagger(cid);
	}
	,getTuto: function(name,step) {
		return new Tuto(name,step);
	}
	,overlay: function(url,title,large) {
		if(large == null) large = true;
		var r = new haxe_Http(url);
		r.onData = function(data) {
			var m = js.JQuery("#myModal");
			m.find(".modal-body").html(data);
			if(title != null) m.find(".modal-title").html(title);
			if(!large) m.find(".modal-dialog").removeClass("modal-lg");
			js.JQuery("#myModal").modal();
		};
		r.request();
	}
	,__class__: App
};
var Cart = function() {
	this.products = new haxe_ds_IntMap();
	this.order = { products : []};
	this.categories = [];
	this.pinnedCategories = [];
};
$hxClasses["Cart"] = Cart;
Cart.__name__ = ["Cart"];
Cart.prototype = {
	products: null
	,categories: null
	,pinnedCategories: null
	,order: null
	,loader: null
	,cartTop: null
	,cartLeft: null
	,cartWidth: null
	,jWindow: null
	,cartContainer: null
	,date: null
	,place: null
	,add: function(pid) {
		var _g = this;
		this.loader.show();
		var q = js.JQuery("#productQt" + pid).val();
		var qt = 0.0;
		var p = this.products.h[pid];
		if(p.hasFloatQt) {
			q = StringTools.replace(q,",",".");
			qt = parseFloat(q);
		} else qt = Std.parseInt(q);
		if(qt == null) qt = 1;
		var r = new haxe_Http("/shop/add/" + pid + "/" + qt);
		r.onData = function(data) {
			_g.loader.hide();
			var d = JSON.parse(data);
			if(!d.success) js_Browser.alert("Erreur : " + Std.string(d));
			_g.subAdd(pid,qt);
			_g.render();
		};
		r.request();
	}
	,subAdd: function(pid,qt) {
		var _g = 0;
		var _g1 = this.order.products;
		while(_g < _g1.length) {
			var p = _g1[_g];
			++_g;
			if(p.productId == pid) {
				p.quantity += qt;
				this.render();
				return;
			}
		}
		this.order.products.push({ productId : pid, quantity : qt});
	}
	,render: function() {
		var _g = this;
		var c = js.JQuery("#cart");
		c.empty();
		c.append(Lambda.map(this.order.products,function(x) {
			var p = _g.products.h[x.productId];
			if(p == null) return "";
			var btn = "<a onClick='cart.remove(" + p.id + ")' class='btn btn-default btn-xs' data-toggle='tooltip' data-placement='top' title='Retirer de la commande'><span class='glyphicon glyphicon-remove'></span></a>&nbsp;";
			return "<div class='row'> \r\n\t\t\t\t<div class = 'order col-md-9' > <b> " + x.quantity + " </b> x " + p.name + " </div>\r\n\t\t\t\t<div class = 'col-md-3'> " + btn + "</div>\t\t\t\r\n\t\t\t</div>";
		}).join("\n"));
		var total = 0.0;
		var _g1 = 0;
		var _g11 = this.order.products;
		while(_g1 < _g11.length) {
			var p1 = _g11[_g1];
			++_g1;
			var pinfo = this.products.h[p1.productId];
			if(pinfo == null) continue;
			total += p1.quantity * pinfo.price;
		}
		var ffilter = new sugoi_form_filters_FloatFilter();
		var total1 = ffilter.filter(Std.string(App.roundTo(total,2)));
		c.append("<div class='total'>TOTAL : " + total1 + "€</div>");
	}
	,findCategoryName: function(cid) {
		var _g = 0;
		var _g1 = this.categories;
		while(_g < _g1.length) {
			var cg = _g1[_g];
			++_g;
			var _g2 = 0;
			var _g3 = cg.categs;
			while(_g2 < _g3.length) {
				var c = _g3[_g2];
				++_g2;
				if(cid == c.id) return c.name;
			}
		}
		var _g4 = 0;
		var _g11 = this.pinnedCategories;
		while(_g4 < _g11.length) {
			var cg1 = _g11[_g4];
			++_g4;
			var _g21 = 0;
			var _g31 = cg1.categs;
			while(_g21 < _g31.length) {
				var c1 = _g31[_g21];
				++_g21;
				if(cid == c1.id) return c1.name;
			}
		}
		return null;
	}
	,sortProductsBy: function() {
		var groups = new haxe_ds_IntMap();
		var pinned = new haxe_ds_IntMap();
		var firstCategGroup = this.categories[0].categs;
		var pList;
		var _this = Lambda.array(this.products);
		pList = _this.slice();
		var _g = 0;
		var _g1 = pList.slice();
		while(_g < _g1.length) {
			var p = _g1[_g];
			++_g;
			p.element.remove();
			var _g2 = 0;
			var _g3 = p.categories;
			while(_g2 < _g3.length) {
				var categ = [_g3[_g2]];
				++_g2;
				if(Lambda.find(firstCategGroup,(function(categ) {
					return function(c) {
						return c.id == categ[0];
					};
				})(categ)) != null) {
					var g = groups.h[categ[0]];
					if(g == null) {
						var name = this.findCategoryName(categ[0]);
						g = { name : name, products : []};
					}
					g.products.push(p);
					HxOverrides.remove(pList,p);
					groups.h[categ[0]] = g;
				} else {
					var isInPinnedCateg = false;
					var _g4 = 0;
					var _g5 = this.pinnedCategories;
					while(_g4 < _g5.length) {
						var cg = _g5[_g4];
						++_g4;
						if(Lambda.find(cg.categs,(function(categ) {
							return function(c1) {
								return c1.id == categ[0];
							};
						})(categ)) != null) {
							isInPinnedCateg = true;
							break;
						}
					}
					if(isInPinnedCateg) {
						var c2 = pinned.h[categ[0]];
						if(c2 == null) {
							var name1 = this.findCategoryName(categ[0]);
							c2 = { name : name1, products : []};
						}
						c2.products.push(p);
						HxOverrides.remove(pList,p);
						pinned.h[categ[0]] = c2;
					} else continue;
				}
			}
		}
		if(pList.length > 0) groups.h[0] = { name : "Autres", products : pList};
		var container = js.JQuery(".shop .body");
		var _g6 = 0;
		var _g11 = [pinned,groups];
		while(_g6 < _g11.length) {
			var source = _g11[_g6];
			++_g6;
			var $it0 = source.iterator();
			while( $it0.hasNext() ) {
				var o = $it0.next();
				if(o.products.length == 0) continue;
				container.append("<div class='col-md-12'><div class='catHeader'>" + o.name + "</div></div>");
				var _g21 = 0;
				var _g31 = o.products;
				while(_g21 < _g31.length) {
					var p1 = _g31[_g21];
					++_g21;
					if(p1.element.parent().length == 0) container.append(p1.element); else {
						var clone = p1.element.clone();
						container.append(clone);
					}
				}
			}
		}
		js.JQuery(".product").show();
	}
	,isEmpty: function() {
		return this.order.products.length == 0;
	}
	,submit: function() {
		var _g = this;
		var req = new haxe_Http("/shop/submit");
		req.onData = function(d) {
			window.location.href = "/shop/validate/" + _g.place + "/" + _g.date;
		};
		req.addParameter("data",JSON.stringify(this.order));
		req.request(true);
	}
	,filter: function(cat) {
		js.JQuery(".tag").removeClass("active").children().remove("span");
		var bt = js.JQuery("#tag" + cat);
		bt.addClass("active").prepend("<span class ='glyphicon glyphicon-ok'></span> ");
		var $it0 = this.products.iterator();
		while( $it0.hasNext() ) {
			var p = $it0.next();
			if(cat == 0 || Lambda.has(p.categories,cat)) js.JQuery(".shop .product" + p.id).fadeIn(300); else js.JQuery(".shop .product" + p.id).fadeOut(300);
		}
	}
	,remove: function(pid) {
		var _g = this;
		this.loader.show();
		var r = new haxe_Http("/shop/remove/" + pid);
		r.onData = function(data) {
			_g.loader.hide();
			var d = JSON.parse(data);
			if(!d.success) js_Browser.alert("Erreur : " + Std.string(d));
			var _g1 = 0;
			var _g2 = _g.order.products.slice();
			while(_g1 < _g2.length) {
				var p = _g2[_g1];
				++_g1;
				if(p.productId == pid) {
					HxOverrides.remove(_g.order.products,p);
					_g.render();
					return;
				}
			}
			_g.render();
		};
		r.request();
	}
	,init: function(place,date) {
		var _g = this;
		this.place = place;
		this.date = date;
		this.loader = js.JQuery("#cartContainer #loader");
		var req = new haxe_Http("/shop/init/" + place + "/" + date);
		req.onData = function(data) {
			_g.loader.hide();
			var data1 = haxe_Unserializer.run(data);
			var _g1 = 0;
			var _g2 = data1.categories;
			while(_g1 < _g2.length) {
				var cg = _g2[_g1];
				++_g1;
				if(cg.pinned) _g.pinnedCategories.push(cg); else _g.categories.push(cg);
			}
			var _g11 = 0;
			var _g21 = data1.products;
			while(_g11 < _g21.length) {
				var p = _g21[_g11];
				++_g11;
				p.element = js.JQuery(".product" + p.id);
				var id = p.id;
				_g.products.h[id] = p;
			}
			var _g12 = 0;
			var _g22 = data1.order.products;
			while(_g12 < _g22.length) {
				var p1 = _g22[_g12];
				++_g12;
				_g.subAdd(p1.productId,p1.quantity);
			}
			_g.render();
			_g.sortProductsBy();
		};
		req.request();
	}
	,onScroll: function(e) {
		if(this.jWindow.scrollTop() > this.cartTop) {
			this.cartContainer.addClass("scrolled");
			this.cartContainer.css("left",Std.string(this.cartLeft) + "px");
			this.cartContainer.css("top",Std.string(this.cartTop) + "px");
			this.cartContainer.css("width",Std.string(this.cartWidth) + "px");
		} else {
			this.cartContainer.removeClass("scrolled");
			this.cartContainer.css("left","");
			this.cartContainer.css("top","");
			this.cartContainer.css("width","");
		}
	}
	,__class__: Cart
};
var ProductType = $hxClasses["ProductType"] = { __ename__ : ["ProductType"], __constructs__ : ["CTVegetable","CTCheese","CTChicken","CTUnknown","CTWine","CTMeat","CTEggs","CTHoney","CTFish","CTJuice","CTApple","CTBread","CTYahourt"] };
ProductType.CTVegetable = ["CTVegetable",0];
ProductType.CTVegetable.toString = $estr;
ProductType.CTVegetable.__enum__ = ProductType;
ProductType.CTCheese = ["CTCheese",1];
ProductType.CTCheese.toString = $estr;
ProductType.CTCheese.__enum__ = ProductType;
ProductType.CTChicken = ["CTChicken",2];
ProductType.CTChicken.toString = $estr;
ProductType.CTChicken.__enum__ = ProductType;
ProductType.CTUnknown = ["CTUnknown",3];
ProductType.CTUnknown.toString = $estr;
ProductType.CTUnknown.__enum__ = ProductType;
ProductType.CTWine = ["CTWine",4];
ProductType.CTWine.toString = $estr;
ProductType.CTWine.__enum__ = ProductType;
ProductType.CTMeat = ["CTMeat",5];
ProductType.CTMeat.toString = $estr;
ProductType.CTMeat.__enum__ = ProductType;
ProductType.CTEggs = ["CTEggs",6];
ProductType.CTEggs.toString = $estr;
ProductType.CTEggs.__enum__ = ProductType;
ProductType.CTHoney = ["CTHoney",7];
ProductType.CTHoney.toString = $estr;
ProductType.CTHoney.__enum__ = ProductType;
ProductType.CTFish = ["CTFish",8];
ProductType.CTFish.toString = $estr;
ProductType.CTFish.__enum__ = ProductType;
ProductType.CTJuice = ["CTJuice",9];
ProductType.CTJuice.toString = $estr;
ProductType.CTJuice.__enum__ = ProductType;
ProductType.CTApple = ["CTApple",10];
ProductType.CTApple.toString = $estr;
ProductType.CTApple.__enum__ = ProductType;
ProductType.CTBread = ["CTBread",11];
ProductType.CTBread.toString = $estr;
ProductType.CTBread.__enum__ = ProductType;
ProductType.CTYahourt = ["CTYahourt",12];
ProductType.CTYahourt.toString = $estr;
ProductType.CTYahourt.__enum__ = ProductType;
ProductType.__empty_constructs__ = [ProductType.CTVegetable,ProductType.CTCheese,ProductType.CTChicken,ProductType.CTUnknown,ProductType.CTWine,ProductType.CTMeat,ProductType.CTEggs,ProductType.CTHoney,ProductType.CTFish,ProductType.CTJuice,ProductType.CTApple,ProductType.CTBread,ProductType.CTYahourt];
var Event = $hxClasses["Event"] = { __ename__ : ["Event"], __constructs__ : ["Page","Nav"] };
Event.Page = function(uri) { var $x = ["Page",0,uri]; $x.__enum__ = Event; $x.toString = $estr; return $x; };
Event.Nav = function(nav,name) { var $x = ["Nav",1,nav,name]; $x.__enum__ = Event; $x.toString = $estr; return $x; };
Event.__empty_constructs__ = [];
var TutoAction = $hxClasses["TutoAction"] = { __ename__ : ["TutoAction"], __constructs__ : ["TAPage","TANext"] };
TutoAction.TAPage = function(uri) { var $x = ["TAPage",0,uri]; $x.__enum__ = TutoAction; $x.toString = $estr; return $x; };
TutoAction.TANext = ["TANext",1];
TutoAction.TANext.toString = $estr;
TutoAction.TANext.__enum__ = TutoAction;
TutoAction.__empty_constructs__ = [TutoAction.TANext];
var TutoPlacement = $hxClasses["TutoPlacement"] = { __ename__ : ["TutoPlacement"], __constructs__ : ["TPTop","TPBottom","TPLeft","TPRight"] };
TutoPlacement.TPTop = ["TPTop",0];
TutoPlacement.TPTop.toString = $estr;
TutoPlacement.TPTop.__enum__ = TutoPlacement;
TutoPlacement.TPBottom = ["TPBottom",1];
TutoPlacement.TPBottom.toString = $estr;
TutoPlacement.TPBottom.__enum__ = TutoPlacement;
TutoPlacement.TPLeft = ["TPLeft",2];
TutoPlacement.TPLeft.toString = $estr;
TutoPlacement.TPLeft.__enum__ = TutoPlacement;
TutoPlacement.TPRight = ["TPRight",3];
TutoPlacement.TPRight.toString = $estr;
TutoPlacement.TPRight.__enum__ = TutoPlacement;
TutoPlacement.__empty_constructs__ = [TutoPlacement.TPTop,TutoPlacement.TPBottom,TutoPlacement.TPLeft,TutoPlacement.TPRight];
var _$Map_Map_$Impl_$ = {};
$hxClasses["_Map.Map_Impl_"] = _$Map_Map_$Impl_$;
_$Map_Map_$Impl_$.__name__ = ["_Map","Map_Impl_"];
_$Map_Map_$Impl_$._new = null;
_$Map_Map_$Impl_$.set = function(this1,key,value) {
	this1.set(key,value);
};
_$Map_Map_$Impl_$.get = function(this1,key) {
	return this1.get(key);
};
_$Map_Map_$Impl_$.exists = function(this1,key) {
	return this1.exists(key);
};
_$Map_Map_$Impl_$.remove = function(this1,key) {
	return this1.remove(key);
};
_$Map_Map_$Impl_$.keys = function(this1) {
	return this1.keys();
};
_$Map_Map_$Impl_$.iterator = function(this1) {
	return this1.iterator();
};
_$Map_Map_$Impl_$.toString = function(this1) {
	return this1.toString();
};
_$Map_Map_$Impl_$.arrayWrite = function(this1,k,v) {
	this1.set(k,v);
	return v;
};
_$Map_Map_$Impl_$.toStringMap = function(t) {
	return new haxe_ds_StringMap();
};
_$Map_Map_$Impl_$.toIntMap = function(t) {
	return new haxe_ds_IntMap();
};
_$Map_Map_$Impl_$.toEnumValueMapMap = function(t) {
	return new haxe_ds_EnumValueMap();
};
_$Map_Map_$Impl_$.toObjectMap = function(t) {
	return new haxe_ds_ObjectMap();
};
_$Map_Map_$Impl_$.fromStringMap = function(map) {
	return map;
};
_$Map_Map_$Impl_$.fromIntMap = function(map) {
	return map;
};
_$Map_Map_$Impl_$.fromObjectMap = function(map) {
	return map;
};
var Data = function() { };
$hxClasses["Data"] = Data;
Data.__name__ = ["Data"];
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
$hxClasses["EReg"] = EReg;
EReg.__name__ = ["EReg"];
EReg.prototype = {
	r: null
	,match: function(s) {
		if(this.r.global) this.r.lastIndex = 0;
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) return this.r.m[n]; else throw new js__$Boot_HaxeError("EReg::matched");
	}
	,matchedLeft: function() {
		if(this.r.m == null) throw new js__$Boot_HaxeError("No string matched");
		return HxOverrides.substr(this.r.s,0,this.r.m.index);
	}
	,matchedRight: function() {
		if(this.r.m == null) throw new js__$Boot_HaxeError("No string matched");
		var sz = this.r.m.index + this.r.m[0].length;
		return HxOverrides.substr(this.r.s,sz,this.r.s.length - sz);
	}
	,matchedPos: function() {
		if(this.r.m == null) throw new js__$Boot_HaxeError("No string matched");
		return { pos : this.r.m.index, len : this.r.m[0].length};
	}
	,matchSub: function(s,pos,len) {
		if(len == null) len = -1;
		if(this.r.global) {
			this.r.lastIndex = pos;
			this.r.m = this.r.exec(len < 0?s:HxOverrides.substr(s,0,pos + len));
			var b = this.r.m != null;
			if(b) this.r.s = s;
			return b;
		} else {
			var b1 = this.match(len < 0?HxOverrides.substr(s,pos,null):HxOverrides.substr(s,pos,len));
			if(b1) {
				this.r.s = s;
				this.r.m.index += pos;
			}
			return b1;
		}
	}
	,split: function(s) {
		var d = "#__delim__#";
		return s.replace(this.r,d).split(d);
	}
	,replace: function(s,by) {
		return s.replace(this.r,by);
	}
	,map: function(s,f) {
		var offset = 0;
		var buf = new StringBuf();
		do {
			if(offset >= s.length) break; else if(!this.matchSub(s,offset)) {
				buf.add(HxOverrides.substr(s,offset,null));
				break;
			}
			var p = this.matchedPos();
			buf.add(HxOverrides.substr(s,offset,p.pos - offset));
			buf.add(f(this));
			if(p.len == 0) {
				buf.add(HxOverrides.substr(s,p.pos,1));
				offset = p.pos + 1;
			} else offset = p.pos + p.len;
		} while(this.r.global);
		if(!this.r.global && offset > 0 && offset < s.length) buf.add(HxOverrides.substr(s,offset,null));
		return buf.b;
	}
	,__class__: EReg
};
var HxOverrides = function() { };
$hxClasses["HxOverrides"] = HxOverrides;
HxOverrides.__name__ = ["HxOverrides"];
HxOverrides.dateStr = function(date) {
	var m = date.getMonth() + 1;
	var d = date.getDate();
	var h = date.getHours();
	var mi = date.getMinutes();
	var s = date.getSeconds();
	return date.getFullYear() + "-" + (m < 10?"0" + m:"" + m) + "-" + (d < 10?"0" + d:"" + d) + " " + (h < 10?"0" + h:"" + h) + ":" + (mi < 10?"0" + mi:"" + mi) + ":" + (s < 10?"0" + s:"" + s);
};
HxOverrides.strDate = function(s) {
	var _g = s.length;
	switch(_g) {
	case 8:
		var k = s.split(":");
		var d = new Date();
		d.setTime(0);
		d.setUTCHours(k[0]);
		d.setUTCMinutes(k[1]);
		d.setUTCSeconds(k[2]);
		return d;
	case 10:
		var k1 = s.split("-");
		return new Date(k1[0],k1[1] - 1,k1[2],0,0,0);
	case 19:
		var k2 = s.split(" ");
		var y = k2[0].split("-");
		var t = k2[1].split(":");
		return new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
	default:
		throw new js__$Boot_HaxeError("Invalid date format : " + s);
	}
};
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) i = 0;
	}
	while(i < len) {
		if(a[i] === obj) return i;
		i++;
	}
	return -1;
};
HxOverrides.lastIndexOf = function(a,obj,i) {
	var len = a.length;
	if(i >= len) i = len - 1; else if(i < 0) i += len;
	while(i >= 0) {
		if(a[i] === obj) return i;
		i--;
	}
	return -1;
};
HxOverrides.remove = function(a,obj) {
	var i = HxOverrides.indexOf(a,obj,0);
	if(i == -1) return false;
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var IntIterator = function(min,max) {
	this.min = min;
	this.max = max;
};
$hxClasses["IntIterator"] = IntIterator;
IntIterator.__name__ = ["IntIterator"];
IntIterator.prototype = {
	min: null
	,max: null
	,hasNext: function() {
		return this.min < this.max;
	}
	,next: function() {
		return this.min++;
	}
	,__class__: IntIterator
};
var Lambda = function() { };
$hxClasses["Lambda"] = Lambda;
Lambda.__name__ = ["Lambda"];
Lambda.array = function(it) {
	var a = [];
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var i = $it0.next();
		a.push(i);
	}
	return a;
};
Lambda.list = function(it) {
	var l = new List();
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var i = $it0.next();
		l.add(i);
	}
	return l;
};
Lambda.map = function(it,f) {
	var l = new List();
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		l.add(f(x));
	}
	return l;
};
Lambda.mapi = function(it,f) {
	var l = new List();
	var i = 0;
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		l.add(f(i++,x));
	}
	return l;
};
Lambda.has = function(it,elt) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(x == elt) return true;
	}
	return false;
};
Lambda.exists = function(it,f) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(f(x)) return true;
	}
	return false;
};
Lambda.foreach = function(it,f) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(!f(x)) return false;
	}
	return true;
};
Lambda.iter = function(it,f) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		f(x);
	}
};
Lambda.filter = function(it,f) {
	var l = new List();
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(f(x)) l.add(x);
	}
	return l;
};
Lambda.fold = function(it,f,first) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		first = f(x,first);
	}
	return first;
};
Lambda.count = function(it,pred) {
	var n = 0;
	if(pred == null) {
		var $it0 = $iterator(it)();
		while( $it0.hasNext() ) {
			var _ = $it0.next();
			n++;
		}
	} else {
		var $it1 = $iterator(it)();
		while( $it1.hasNext() ) {
			var x = $it1.next();
			if(pred(x)) n++;
		}
	}
	return n;
};
Lambda.empty = function(it) {
	return !$iterator(it)().hasNext();
};
Lambda.indexOf = function(it,v) {
	var i = 0;
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var v2 = $it0.next();
		if(v == v2) return i;
		i++;
	}
	return -1;
};
Lambda.find = function(it,f) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var v = $it0.next();
		if(f(v)) return v;
	}
	return null;
};
Lambda.concat = function(a,b) {
	var l = new List();
	var $it0 = $iterator(a)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		l.add(x);
	}
	var $it1 = $iterator(b)();
	while( $it1.hasNext() ) {
		var x1 = $it1.next();
		l.add(x1);
	}
	return l;
};
var List = function() {
	this.length = 0;
};
$hxClasses["List"] = List;
List.__name__ = ["List"];
List.prototype = {
	h: null
	,q: null
	,length: null
	,add: function(item) {
		var x = [item];
		if(this.h == null) this.h = x; else this.q[1] = x;
		this.q = x;
		this.length++;
	}
	,push: function(item) {
		var x = [item,this.h];
		this.h = x;
		if(this.q == null) this.q = x;
		this.length++;
	}
	,first: function() {
		if(this.h == null) return null; else return this.h[0];
	}
	,last: function() {
		if(this.q == null) return null; else return this.q[0];
	}
	,pop: function() {
		if(this.h == null) return null;
		var x = this.h[0];
		this.h = this.h[1];
		if(this.h == null) this.q = null;
		this.length--;
		return x;
	}
	,isEmpty: function() {
		return this.h == null;
	}
	,clear: function() {
		this.h = null;
		this.q = null;
		this.length = 0;
	}
	,remove: function(v) {
		var prev = null;
		var l = this.h;
		while(l != null) {
			if(l[0] == v) {
				if(prev == null) this.h = l[1]; else prev[1] = l[1];
				if(this.q == l) this.q = prev;
				this.length--;
				return true;
			}
			prev = l;
			l = l[1];
		}
		return false;
	}
	,iterator: function() {
		return new _$List_ListIterator(this.h);
	}
	,toString: function() {
		var s_b = "";
		var first = true;
		var l = this.h;
		s_b += "{";
		while(l != null) {
			if(first) first = false; else s_b += ", ";
			s_b += Std.string(Std.string(l[0]));
			l = l[1];
		}
		s_b += "}";
		return s_b;
	}
	,join: function(sep) {
		var s = new StringBuf();
		var first = true;
		var l = this.h;
		while(l != null) {
			if(first) first = false; else if(sep == null) s.b += "null"; else s.b += "" + sep;
			s.add(l[0]);
			l = l[1];
		}
		return s.b;
	}
	,filter: function(f) {
		var l2 = new List();
		var l = this.h;
		while(l != null) {
			var v = l[0];
			l = l[1];
			if(f(v)) l2.add(v);
		}
		return l2;
	}
	,map: function(f) {
		var b = new List();
		var l = this.h;
		while(l != null) {
			var v = l[0];
			l = l[1];
			b.add(f(v));
		}
		return b;
	}
	,__class__: List
};
var _$List_ListIterator = function(head) {
	this.head = head;
	this.val = null;
};
$hxClasses["_List.ListIterator"] = _$List_ListIterator;
_$List_ListIterator.__name__ = ["_List","ListIterator"];
_$List_ListIterator.prototype = {
	head: null
	,val: null
	,hasNext: function() {
		return this.head != null;
	}
	,next: function() {
		this.val = this.head[0];
		this.head = this.head[1];
		return this.val;
	}
	,__class__: _$List_ListIterator
};
Math.__name__ = ["Math"];
var Reflect = function() { };
$hxClasses["Reflect"] = Reflect;
Reflect.__name__ = ["Reflect"];
Reflect.hasField = function(o,field) {
	return Object.prototype.hasOwnProperty.call(o,field);
};
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
Reflect.setField = function(o,field,value) {
	o[field] = value;
};
Reflect.getProperty = function(o,field) {
	var tmp;
	if(o == null) return null; else if(o.__properties__ && (tmp = o.__properties__["get_" + field])) return o[tmp](); else return o[field];
};
Reflect.setProperty = function(o,field,value) {
	var tmp;
	if(o.__properties__ && (tmp = o.__properties__["set_" + field])) o[tmp](value); else o[field] = value;
};
Reflect.callMethod = function(o,func,args) {
	return func.apply(o,args);
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) a.push(f);
		}
	}
	return a;
};
Reflect.isFunction = function(f) {
	return typeof(f) == "function" && !(f.__name__ || f.__ename__);
};
Reflect.compare = function(a,b) {
	if(a == b) return 0; else if(a > b) return 1; else return -1;
};
Reflect.compareMethods = function(f1,f2) {
	if(f1 == f2) return true;
	if(!Reflect.isFunction(f1) || !Reflect.isFunction(f2)) return false;
	return f1.scope == f2.scope && f1.method == f2.method && f1.method != null;
};
Reflect.isObject = function(v) {
	if(v == null) return false;
	var t = typeof(v);
	return t == "string" || t == "object" && v.__enum__ == null || t == "function" && (v.__name__ || v.__ename__) != null;
};
Reflect.isEnumValue = function(v) {
	return v != null && v.__enum__ != null;
};
Reflect.deleteField = function(o,field) {
	if(!Object.prototype.hasOwnProperty.call(o,field)) return false;
	delete(o[field]);
	return true;
};
Reflect.copy = function(o) {
	var o2 = { };
	var _g = 0;
	var _g1 = Reflect.fields(o);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		Reflect.setField(o2,f,Reflect.field(o,f));
	}
	return o2;
};
Reflect.makeVarArgs = function(f) {
	return function() {
		var a = Array.prototype.slice.call(arguments);
		return f(a);
	};
};
var Std = function() { };
$hxClasses["Std"] = Std;
Std.__name__ = ["Std"];
Std["is"] = function(v,t) {
	return js_Boot.__instanceof(v,t);
};
Std.instance = function(value,c) {
	if((value instanceof c)) return value; else return null;
};
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
Std["int"] = function(x) {
	return x | 0;
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
Std.parseFloat = function(x) {
	return parseFloat(x);
};
Std.random = function(x) {
	if(x <= 0) return 0; else return Math.floor(Math.random() * x);
};
var StringBuf = function() {
	this.b = "";
};
$hxClasses["StringBuf"] = StringBuf;
StringBuf.__name__ = ["StringBuf"];
StringBuf.prototype = {
	b: null
	,get_length: function() {
		return this.b.length;
	}
	,add: function(x) {
		this.b += Std.string(x);
	}
	,addChar: function(c) {
		this.b += String.fromCharCode(c);
	}
	,addSub: function(s,pos,len) {
		if(len == null) this.b += HxOverrides.substr(s,pos,null); else this.b += HxOverrides.substr(s,pos,len);
	}
	,toString: function() {
		return this.b;
	}
	,__class__: StringBuf
	,__properties__: {get_length:"get_length"}
};
var StringTools = function() { };
$hxClasses["StringTools"] = StringTools;
StringTools.__name__ = ["StringTools"];
StringTools.urlEncode = function(s) {
	return encodeURIComponent(s);
};
StringTools.urlDecode = function(s) {
	return decodeURIComponent(s.split("+").join(" "));
};
StringTools.htmlEscape = function(s,quotes) {
	s = s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
	if(quotes) return s.split("\"").join("&quot;").split("'").join("&#039;"); else return s;
};
StringTools.htmlUnescape = function(s) {
	return s.split("&gt;").join(">").split("&lt;").join("<").split("&quot;").join("\"").split("&#039;").join("'").split("&amp;").join("&");
};
StringTools.startsWith = function(s,start) {
	return s.length >= start.length && HxOverrides.substr(s,0,start.length) == start;
};
StringTools.endsWith = function(s,end) {
	var elen = end.length;
	var slen = s.length;
	return slen >= elen && HxOverrides.substr(s,slen - elen,elen) == end;
};
StringTools.isSpace = function(s,pos) {
	var c = HxOverrides.cca(s,pos);
	return c > 8 && c < 14 || c == 32;
};
StringTools.ltrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,r)) r++;
	if(r > 0) return HxOverrides.substr(s,r,l - r); else return s;
};
StringTools.rtrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,l - r - 1)) r++;
	if(r > 0) return HxOverrides.substr(s,0,l - r); else return s;
};
StringTools.trim = function(s) {
	return StringTools.ltrim(StringTools.rtrim(s));
};
StringTools.lpad = function(s,c,l) {
	if(c.length <= 0) return s;
	while(s.length < l) s = c + s;
	return s;
};
StringTools.rpad = function(s,c,l) {
	if(c.length <= 0) return s;
	while(s.length < l) s = s + c;
	return s;
};
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
};
StringTools.hex = function(n,digits) {
	var s = "";
	var hexChars = "0123456789ABCDEF";
	do {
		s = hexChars.charAt(n & 15) + s;
		n >>>= 4;
	} while(n > 0);
	if(digits != null) while(s.length < digits) s = "0" + s;
	return s;
};
StringTools.fastCodeAt = function(s,index) {
	return s.charCodeAt(index);
};
StringTools.isEof = function(c) {
	return c != c;
};
var Tagger = function(cid) {
	this.contractId = cid;
};
$hxClasses["Tagger"] = Tagger;
Tagger.__name__ = ["Tagger"];
Tagger.prototype = {
	contractId: null
	,data: null
	,init: function() {
		var _g = this;
		var req = new haxe_Http("/product/categorizeInit/" + this.contractId);
		req.onData = function(_data) {
			_g.data = JSON.parse(_data);
			_g.render();
		};
		req.request();
	}
	,render: function() {
		var _g = this;
		var html = new StringBuf();
		html.b += "<table class='table'>";
		var _g1 = 0;
		var _g11 = this.data.products;
		while(_g1 < _g11.length) {
			var p = _g11[_g1];
			++_g1;
			html.b += Std.string("<tr class='p" + p.product.id + "'>");
			html.b += Std.string("<td><input type='checkbox' name='p" + p.product.id + "' /></td>");
			html.b += Std.string("<td>" + p.product.name + "</td>");
			var tags = [];
			var _g2 = 0;
			var _g3 = p.categories;
			while(_g2 < _g3.length) {
				var c = _g3[_g2];
				++_g2;
				var name = "";
				var color = "";
				var _g4 = 0;
				var _g5 = this.data.categories;
				while(_g4 < _g5.length) {
					var gc = _g5[_g4];
					++_g4;
					var _g6 = 0;
					var _g7 = gc.tags;
					while(_g6 < _g7.length) {
						var t = _g7[_g6];
						++_g6;
						if(c == t.id) {
							name = t.name;
							color = gc.color;
						}
					}
				}
				tags.push("<span class='tag t" + c + "' style='background-color:" + color + ";cursor:pointer;'>" + name + "</span>");
			}
			html.add("<td class='tags'>" + tags.join(" ") + "</td>");
			html.b += "</tr>";
		}
		html.b += "</table>";
		js.JQuery("#tagger").html(html.b);
		js.JQuery("#tagger .tag").click(function(e) {
			var tid = Std.parseInt((function($this) {
				var $r;
				var _this = e.currentTarget.getAttribute("class").split(" ")[1];
				$r = HxOverrides.substr(_this,1,null);
				return $r;
			}(this)));
			haxe_Log.trace("tag " + tid,{ fileName : "Tagger.hx", lineNumber : 64, className : "Tagger", methodName : "render"});
			var pid = Std.parseInt((function($this) {
				var $r;
				var _this1 = e.currentTarget.parentElement.parentElement.getAttribute("class");
				$r = HxOverrides.substr(_this1,1,null);
				return $r;
			}(this)));
			haxe_Log.trace("product " + pid,{ fileName : "Tagger.hx", lineNumber : 68, className : "Tagger", methodName : "render"});
			e.currentTarget.remove();
			_g.remove(tid,pid);
		});
	}
	,add: function() {
		var tagId = Std.parseInt(js.JQuery("#tag").val());
		if(tagId == 0) js_Browser.alert("Impossible de trouver la catégorie selectionnée");
		var pids = [];
		var $it0 = (function($this) {
			var $r;
			var _this = js.JQuery("#tagger input:checked");
			$r = (_this.iterator)();
			return $r;
		}(this));
		while( $it0.hasNext() ) {
			var e = $it0.next();
			pids.push(Std.parseInt((function($this) {
				var $r;
				var _this1 = e.attr("name");
				$r = HxOverrides.substr(_this1,1,null);
				return $r;
			}(this))));
		}
		if(pids.length == 0) js_Browser.alert("Sélectionnez un produit afin de pouvoir lui attribuer une catégorie");
		var _g = 0;
		while(_g < pids.length) {
			var p = pids[_g];
			++_g;
			this.addTag(tagId,p);
		}
		this.render();
	}
	,remove: function(tagId,productId) {
		var _g = 0;
		var _g1 = this.data.products;
		while(_g < _g1.length) {
			var p = _g1[_g];
			++_g;
			if(p.product.id == productId) {
				var _g2 = 0;
				var _g3 = p.categories;
				while(_g2 < _g3.length) {
					var t = _g3[_g2];
					++_g2;
					if(t == tagId) HxOverrides.remove(p.categories,t);
				}
			}
		}
	}
	,addTag: function(tagId,productId) {
		var _g = 0;
		var _g1 = this.data.products;
		while(_g < _g1.length) {
			var p = _g1[_g];
			++_g;
			if(p.product.id == productId) {
				var _g2 = 0;
				var _g3 = p.categories;
				while(_g2 < _g3.length) {
					var t = _g3[_g2];
					++_g2;
					if(t == tagId) return;
				}
			}
		}
		var _g4 = 0;
		var _g11 = this.data.products;
		while(_g4 < _g11.length) {
			var p1 = _g11[_g4];
			++_g4;
			if(p1.product.id == productId) {
				p1.categories.push(tagId);
				break;
			}
		}
	}
	,submit: function() {
		var req = new haxe_Http("/product/categorizeSubmit/" + this.contractId);
		req.addParameter("data",JSON.stringify(this.data));
		req.onData = function(_data) {
			js_Browser.alert(_data);
		};
		req.request(true);
	}
	,__class__: Tagger
};
var Tuto = function(name,step) {
	this.name = name;
	this.step = step;
	var tuto = Data.TUTOS.get(name);
	var s = tuto.steps[step];
	var p = js.JQuery(".popover");
	p.popover("hide");
	if(s == null) {
		var m = js.JQuery("#myModal");
		m.modal("show");
		m.addClass("help");
		m.find(".modal-header").html("<span class='glyphicon glyphicon-hand-right'></span> " + tuto.name);
		m.find(".modal-body").html("<span class='glyphicon glyphicon-ok'></span> Ce tutoriel est terminé.");
		var bt = js.JQuery("<a class='btn btn-default'><span class='glyphicon glyphicon-chevron-right'></span> Revenir à la page des tutoriels</a>");
		bt.click(function(_) {
			m.modal("hide");
			window.location.href = "/contract?stopTuto=1";
		});
		m.find(".modal-footer").html(bt);
		m.find(".modal-dialog").removeClass("modal-lg");
	} else if(s.element == null) {
		var m1 = js.JQuery("#myModal");
		m1.modal("show");
		m1.addClass("help");
		m1.find(".modal-body").html(s.text);
		m1.find(".modal-header").html("<span class='glyphicon glyphicon-hand-right'></span> " + tuto.name);
		var bt1 = js.JQuery("<a class='btn btn-default'><span class='glyphicon glyphicon-chevron-right'></span> OK</a>");
		bt1.click(function(_1) {
			m1.modal("hide");
			new Tuto(name,step + 1);
		});
		m1.find(".modal-footer").html(bt1);
		m1.find(".modal-dialog").removeClass("modal-lg");
	} else {
		var x = js.JQuery(s.element).attr("title",tuto.name + " <div class='pull-right'>" + (step + 1) + "/" + tuto.steps.length + "</div>");
		var text = "<p>" + s.text + "</p>";
		var bt2 = null;
		var _g = s.action;
		switch(_g[1]) {
		case 1:
			bt2 = js.JQuery("<p><a class='btn btn-default btn-sm'><span class='glyphicon glyphicon-chevron-right'></span> Suite</a></p>");
			bt2.click(function(_2) {
				new Tuto(name,step + 1);
				if(Tuto.LAST_ELEMENT != null) js.JQuery(s.element).removeClass("highlight");
			});
			break;
		default:
		}
		var p1;
		var _g1 = s.placement;
		switch(_g1[1]) {
		case 0:
			p1 = "top";
			break;
		case 1:
			p1 = "bottom";
			break;
		case 2:
			p1 = "left";
			break;
		case 3:
			p1 = "right";
			break;
		}
		var options = { container : "body", content : text, html : true, placement : p1};
		x.popover(options).popover("show");
		var footer = js.JQuery("<div class='footer'><div class='pull-left'></div><div class='pull-right'></div></div>");
		if(bt2 != null) footer.find(".pull-right").append(bt2);
		footer.find(".pull-left").append(this.makeCloseButton("Stop"));
		js.JQuery(".popover .popover-content").append(footer);
		js.JQuery(s.element).addClass("highlight");
		Tuto.LAST_ELEMENT = s.element;
	}
};
$hxClasses["Tuto"] = Tuto;
Tuto.__name__ = ["Tuto"];
Tuto.prototype = {
	name: null
	,step: null
	,makeCloseButton: function(text) {
		var bt = js.JQuery("<a class='btn btn-default btn-sm'><span class='glyphicon glyphicon-remove'></span> " + text + "</a>");
		bt.click(function(_) {
			window.location.href = "/contract?stopTuto=1";
		});
		return bt;
	}
	,__class__: Tuto
};
var ValueType = $hxClasses["ValueType"] = { __ename__ : ["ValueType"], __constructs__ : ["TNull","TInt","TFloat","TBool","TObject","TFunction","TClass","TEnum","TUnknown"] };
ValueType.TNull = ["TNull",0];
ValueType.TNull.toString = $estr;
ValueType.TNull.__enum__ = ValueType;
ValueType.TInt = ["TInt",1];
ValueType.TInt.toString = $estr;
ValueType.TInt.__enum__ = ValueType;
ValueType.TFloat = ["TFloat",2];
ValueType.TFloat.toString = $estr;
ValueType.TFloat.__enum__ = ValueType;
ValueType.TBool = ["TBool",3];
ValueType.TBool.toString = $estr;
ValueType.TBool.__enum__ = ValueType;
ValueType.TObject = ["TObject",4];
ValueType.TObject.toString = $estr;
ValueType.TObject.__enum__ = ValueType;
ValueType.TFunction = ["TFunction",5];
ValueType.TFunction.toString = $estr;
ValueType.TFunction.__enum__ = ValueType;
ValueType.TClass = function(c) { var $x = ["TClass",6,c]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; };
ValueType.TEnum = function(e) { var $x = ["TEnum",7,e]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; };
ValueType.TUnknown = ["TUnknown",8];
ValueType.TUnknown.toString = $estr;
ValueType.TUnknown.__enum__ = ValueType;
ValueType.__empty_constructs__ = [ValueType.TNull,ValueType.TInt,ValueType.TFloat,ValueType.TBool,ValueType.TObject,ValueType.TFunction,ValueType.TUnknown];
var Type = function() { };
$hxClasses["Type"] = Type;
Type.__name__ = ["Type"];
Type.getClass = function(o) {
	if(o == null) return null; else return js_Boot.getClass(o);
};
Type.getEnum = function(o) {
	if(o == null) return null;
	return o.__enum__;
};
Type.getSuperClass = function(c) {
	return c.__super__;
};
Type.getClassName = function(c) {
	var a = c.__name__;
	if(a == null) return null;
	return a.join(".");
};
Type.getEnumName = function(e) {
	var a = e.__ename__;
	return a.join(".");
};
Type.resolveClass = function(name) {
	var cl = $hxClasses[name];
	if(cl == null || !cl.__name__) return null;
	return cl;
};
Type.resolveEnum = function(name) {
	var e = $hxClasses[name];
	if(e == null || !e.__ename__) return null;
	return e;
};
Type.createInstance = function(cl,args) {
	var _g = args.length;
	switch(_g) {
	case 0:
		return new cl();
	case 1:
		return new cl(args[0]);
	case 2:
		return new cl(args[0],args[1]);
	case 3:
		return new cl(args[0],args[1],args[2]);
	case 4:
		return new cl(args[0],args[1],args[2],args[3]);
	case 5:
		return new cl(args[0],args[1],args[2],args[3],args[4]);
	case 6:
		return new cl(args[0],args[1],args[2],args[3],args[4],args[5]);
	case 7:
		return new cl(args[0],args[1],args[2],args[3],args[4],args[5],args[6]);
	case 8:
		return new cl(args[0],args[1],args[2],args[3],args[4],args[5],args[6],args[7]);
	default:
		throw new js__$Boot_HaxeError("Too many arguments");
	}
	return null;
};
Type.createEmptyInstance = function(cl) {
	function empty() {}; empty.prototype = cl.prototype;
	return new empty();
};
Type.createEnum = function(e,constr,params) {
	var f = Reflect.field(e,constr);
	if(f == null) throw new js__$Boot_HaxeError("No such constructor " + constr);
	if(Reflect.isFunction(f)) {
		if(params == null) throw new js__$Boot_HaxeError("Constructor " + constr + " need parameters");
		return Reflect.callMethod(e,f,params);
	}
	if(params != null && params.length != 0) throw new js__$Boot_HaxeError("Constructor " + constr + " does not need parameters");
	return f;
};
Type.createEnumIndex = function(e,index,params) {
	var c = e.__constructs__[index];
	if(c == null) throw new js__$Boot_HaxeError(index + " is not a valid enum constructor index");
	return Type.createEnum(e,c,params);
};
Type.getInstanceFields = function(c) {
	var a = [];
	for(var i in c.prototype) a.push(i);
	HxOverrides.remove(a,"__class__");
	HxOverrides.remove(a,"__properties__");
	return a;
};
Type.getClassFields = function(c) {
	var a = Reflect.fields(c);
	HxOverrides.remove(a,"__name__");
	HxOverrides.remove(a,"__interfaces__");
	HxOverrides.remove(a,"__properties__");
	HxOverrides.remove(a,"__super__");
	HxOverrides.remove(a,"__meta__");
	HxOverrides.remove(a,"prototype");
	return a;
};
Type.getEnumConstructs = function(e) {
	var a = e.__constructs__;
	return a.slice();
};
Type["typeof"] = function(v) {
	var _g = typeof(v);
	switch(_g) {
	case "boolean":
		return ValueType.TBool;
	case "string":
		return ValueType.TClass(String);
	case "number":
		if(Math.ceil(v) == v % 2147483648.0) return ValueType.TInt;
		return ValueType.TFloat;
	case "object":
		if(v == null) return ValueType.TNull;
		var e = v.__enum__;
		if(e != null) return ValueType.TEnum(e);
		var c = js_Boot.getClass(v);
		if(c != null) return ValueType.TClass(c);
		return ValueType.TObject;
	case "function":
		if(v.__name__ || v.__ename__) return ValueType.TObject;
		return ValueType.TFunction;
	case "undefined":
		return ValueType.TNull;
	default:
		return ValueType.TUnknown;
	}
};
Type.enumEq = function(a,b) {
	if(a == b) return true;
	try {
		if(a[0] != b[0]) return false;
		var _g1 = 2;
		var _g = a.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(!Type.enumEq(a[i],b[i])) return false;
		}
		var e = a.__enum__;
		if(e != b.__enum__ || e == null) return false;
	} catch( e1 ) {
		haxe_CallStack.lastException = e1;
		if (e1 instanceof js__$Boot_HaxeError) e1 = e1.val;
		return false;
	}
	return true;
};
Type.enumConstructor = function(e) {
	return e[0];
};
Type.enumParameters = function(e) {
	return e.slice(2);
};
Type.enumIndex = function(e) {
	return e[1];
};
Type.allEnums = function(e) {
	return e.__empty_constructs__;
};
var haxe_IMap = function() { };
$hxClasses["haxe.IMap"] = haxe_IMap;
haxe_IMap.__name__ = ["haxe","IMap"];
haxe_IMap.prototype = {
	get: null
	,set: null
	,exists: null
	,remove: null
	,keys: null
	,iterator: null
	,toString: null
	,__class__: haxe_IMap
};
var haxe_Http = function(url) {
	this.url = url;
	this.headers = new List();
	this.params = new List();
	this.async = true;
};
$hxClasses["haxe.Http"] = haxe_Http;
haxe_Http.__name__ = ["haxe","Http"];
haxe_Http.requestUrl = function(url) {
	var h = new haxe_Http(url);
	h.async = false;
	var r = null;
	h.onData = function(d) {
		r = d;
	};
	h.onError = function(e) {
		throw new js__$Boot_HaxeError(e);
	};
	h.request(false);
	return r;
};
haxe_Http.prototype = {
	url: null
	,responseData: null
	,async: null
	,postData: null
	,headers: null
	,params: null
	,setHeader: function(header,value) {
		this.headers = Lambda.filter(this.headers,function(h) {
			return h.header != header;
		});
		this.headers.push({ header : header, value : value});
		return this;
	}
	,addHeader: function(header,value) {
		this.headers.push({ header : header, value : value});
		return this;
	}
	,setParameter: function(param,value) {
		this.params = Lambda.filter(this.params,function(p) {
			return p.param != param;
		});
		this.params.push({ param : param, value : value});
		return this;
	}
	,addParameter: function(param,value) {
		this.params.push({ param : param, value : value});
		return this;
	}
	,setPostData: function(data) {
		this.postData = data;
		return this;
	}
	,req: null
	,cancel: function() {
		if(this.req == null) return;
		this.req.abort();
		this.req = null;
	}
	,request: function(post) {
		var me = this;
		me.responseData = null;
		var r = this.req = js_Browser.createXMLHttpRequest();
		var onreadystatechange = function(_) {
			if(r.readyState != 4) return;
			var s;
			try {
				s = r.status;
			} catch( e ) {
				haxe_CallStack.lastException = e;
				if (e instanceof js__$Boot_HaxeError) e = e.val;
				s = null;
			}
			if(s != null) {
				var protocol = window.location.protocol.toLowerCase();
				var rlocalProtocol = new EReg("^(?:about|app|app-storage|.+-extension|file|res|widget):$","");
				var isLocal = rlocalProtocol.match(protocol);
				if(isLocal) if(r.responseText != null) s = 200; else s = 404;
			}
			if(s == undefined) s = null;
			if(s != null) me.onStatus(s);
			if(s != null && s >= 200 && s < 400) {
				me.req = null;
				me.onData(me.responseData = r.responseText);
			} else if(s == null) {
				me.req = null;
				me.onError("Failed to connect or resolve host");
			} else switch(s) {
			case 12029:
				me.req = null;
				me.onError("Failed to connect to host");
				break;
			case 12007:
				me.req = null;
				me.onError("Unknown host");
				break;
			default:
				me.req = null;
				me.responseData = r.responseText;
				me.onError("Http Error #" + r.status);
			}
		};
		if(this.async) r.onreadystatechange = onreadystatechange;
		var uri = this.postData;
		if(uri != null) post = true; else {
			var _g_head = this.params.h;
			var _g_val = null;
			while(_g_head != null) {
				var p;
				p = (function($this) {
					var $r;
					_g_val = _g_head[0];
					_g_head = _g_head[1];
					$r = _g_val;
					return $r;
				}(this));
				if(uri == null) uri = ""; else uri += "&";
				uri += encodeURIComponent(p.param) + "=" + encodeURIComponent(p.value);
			}
		}
		try {
			if(post) r.open("POST",this.url,this.async); else if(uri != null) {
				var question = this.url.split("?").length <= 1;
				r.open("GET",this.url + (question?"?":"&") + uri,this.async);
				uri = null;
			} else r.open("GET",this.url,this.async);
		} catch( e1 ) {
			haxe_CallStack.lastException = e1;
			if (e1 instanceof js__$Boot_HaxeError) e1 = e1.val;
			me.req = null;
			this.onError(e1.toString());
			return;
		}
		if(!Lambda.exists(this.headers,function(h) {
			return h.header == "Content-Type";
		}) && post && this.postData == null) r.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		var _g_head1 = this.headers.h;
		var _g_val1 = null;
		while(_g_head1 != null) {
			var h1;
			h1 = (function($this) {
				var $r;
				_g_val1 = _g_head1[0];
				_g_head1 = _g_head1[1];
				$r = _g_val1;
				return $r;
			}(this));
			r.setRequestHeader(h1.header,h1.value);
		}
		r.send(uri);
		if(!this.async) onreadystatechange(null);
	}
	,onData: function(data) {
	}
	,onError: function(msg) {
	}
	,onStatus: function(status) {
	}
	,__class__: haxe_Http
};
var haxe__$Int32_Int32_$Impl_$ = {};
$hxClasses["haxe._Int32.Int32_Impl_"] = haxe__$Int32_Int32_$Impl_$;
haxe__$Int32_Int32_$Impl_$.__name__ = ["haxe","_Int32","Int32_Impl_"];
haxe__$Int32_Int32_$Impl_$.preIncrement = function(this1) {
	return (function($this) {
		var $r;
		var x = ++this1;
		$r = this1 = x | 0;
		return $r;
	}(this));
};
haxe__$Int32_Int32_$Impl_$.postIncrement = function(this1) {
	var ret = this1++;
	this1 = this1 | 0;
	return ret;
};
haxe__$Int32_Int32_$Impl_$.preDecrement = function(this1) {
	return (function($this) {
		var $r;
		var x = --this1;
		$r = this1 = x | 0;
		return $r;
	}(this));
};
haxe__$Int32_Int32_$Impl_$.postDecrement = function(this1) {
	var ret = this1--;
	this1 = this1 | 0;
	return ret;
};
haxe__$Int32_Int32_$Impl_$.add = function(a,b) {
	return a + b | 0;
};
haxe__$Int32_Int32_$Impl_$.addInt = function(a,b) {
	return a + b | 0;
};
haxe__$Int32_Int32_$Impl_$.sub = function(a,b) {
	return a - b | 0;
};
haxe__$Int32_Int32_$Impl_$.subInt = function(a,b) {
	return a - b | 0;
};
haxe__$Int32_Int32_$Impl_$.intSub = function(a,b) {
	return a - b | 0;
};
haxe__$Int32_Int32_$Impl_$.mul = function(a,b) {
	return a * (b & 65535) + (a * (b >>> 16) << 16 | 0) | 0;
};
haxe__$Int32_Int32_$Impl_$.mulInt = function(a,b) {
	return haxe__$Int32_Int32_$Impl_$.mul(a,b);
};
haxe__$Int32_Int32_$Impl_$.toFloat = function(this1) {
	return this1;
};
haxe__$Int32_Int32_$Impl_$.ucompare = function(a,b) {
	if(a < 0) if(b < 0) return ~b - ~a | 0; else return 1;
	if(b < 0) return -1; else return a - b | 0;
};
haxe__$Int32_Int32_$Impl_$.clamp = function(x) {
	return x | 0;
};
var haxe__$Int64_Int64_$Impl_$ = {};
$hxClasses["haxe._Int64.Int64_Impl_"] = haxe__$Int64_Int64_$Impl_$;
haxe__$Int64_Int64_$Impl_$.__name__ = ["haxe","_Int64","Int64_Impl_"];
haxe__$Int64_Int64_$Impl_$.__properties__ = {get_low:"get_low",get_high:"get_high"}
haxe__$Int64_Int64_$Impl_$._new = function(x) {
	return x;
};
haxe__$Int64_Int64_$Impl_$.copy = function(this1) {
	var x = new haxe__$Int64__$_$_$Int64(this1.high,this1.low);
	return x;
};
haxe__$Int64_Int64_$Impl_$.make = function(high,low) {
	var x = new haxe__$Int64__$_$_$Int64(high,low);
	return x;
};
haxe__$Int64_Int64_$Impl_$.ofInt = function(x) {
	var x1 = new haxe__$Int64__$_$_$Int64(x >> 31,x);
	return x1;
};
haxe__$Int64_Int64_$Impl_$.toInt = function(x) {
	if(x.high != x.low >> 31) throw new js__$Boot_HaxeError("Overflow");
	return x.low;
};
haxe__$Int64_Int64_$Impl_$["is"] = function(val) {
	return js_Boot.__instanceof(val,haxe__$Int64__$_$_$Int64);
};
haxe__$Int64_Int64_$Impl_$.getHigh = function(x) {
	return x.high;
};
haxe__$Int64_Int64_$Impl_$.getLow = function(x) {
	return x.low;
};
haxe__$Int64_Int64_$Impl_$.isNeg = function(x) {
	return x.high < 0;
};
haxe__$Int64_Int64_$Impl_$.isZero = function(x) {
	var b;
	{
		var x1 = new haxe__$Int64__$_$_$Int64(0,0);
		b = x1;
	}
	return x.high == b.high && x.low == b.low;
};
haxe__$Int64_Int64_$Impl_$.compare = function(a,b) {
	var v = a.high - b.high | 0;
	if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b.low);
	if(a.high < 0) {
		if(b.high < 0) return v; else return -1;
	} else if(b.high >= 0) return v; else return 1;
};
haxe__$Int64_Int64_$Impl_$.ucompare = function(a,b) {
	var v = haxe__$Int32_Int32_$Impl_$.ucompare(a.high,b.high);
	if(v != 0) return v; else return haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b.low);
};
haxe__$Int64_Int64_$Impl_$.toStr = function(x) {
	return haxe__$Int64_Int64_$Impl_$.toString(x);
};
haxe__$Int64_Int64_$Impl_$.toString = function(this1) {
	var i = this1;
	if((function($this) {
		var $r;
		var b;
		{
			var x = new haxe__$Int64__$_$_$Int64(0,0);
			b = x;
		}
		$r = i.high == b.high && i.low == b.low;
		return $r;
	}(this))) return "0";
	var str = "";
	var neg = false;
	if(i.high < 0) {
		neg = true;
		var high = ~i.high;
		var low = -i.low;
		if(low == 0) {
			var ret = high++;
			high = high | 0;
			ret;
		}
		var x1 = new haxe__$Int64__$_$_$Int64(high,low);
		i = x1;
	}
	var ten;
	{
		var x2 = new haxe__$Int64__$_$_$Int64(0,10);
		ten = x2;
	}
	while((function($this) {
		var $r;
		var b1;
		{
			var x3 = new haxe__$Int64__$_$_$Int64(0,0);
			b1 = x3;
		}
		$r = i.high != b1.high || i.low != b1.low;
		return $r;
	}(this))) {
		var r = haxe__$Int64_Int64_$Impl_$.divMod(i,ten);
		str = r.modulus.low + str;
		i = r.quotient;
	}
	if(neg) str = "-" + str;
	return str;
};
haxe__$Int64_Int64_$Impl_$.divMod = function(dividend,divisor) {
	if(divisor.high == 0) {
		var _g = divisor.low;
		switch(_g) {
		case 0:
			throw new js__$Boot_HaxeError("divide by zero");
			break;
		case 1:
			return { quotient : (function($this) {
				var $r;
				var x = new haxe__$Int64__$_$_$Int64(dividend.high,dividend.low);
				$r = x;
				return $r;
			}(this)), modulus : (function($this) {
				var $r;
				var x1 = new haxe__$Int64__$_$_$Int64(0,0);
				$r = x1;
				return $r;
			}(this))};
		}
	}
	var divSign = dividend.high < 0 != divisor.high < 0;
	var modulus;
	if(dividend.high < 0) {
		var high = ~dividend.high;
		var low = -dividend.low;
		if(low == 0) {
			var ret = high++;
			high = high | 0;
			ret;
		}
		var x2 = new haxe__$Int64__$_$_$Int64(high,low);
		modulus = x2;
	} else {
		var x3 = new haxe__$Int64__$_$_$Int64(dividend.high,dividend.low);
		modulus = x3;
	}
	if(divisor.high < 0) {
		var high1 = ~divisor.high;
		var low1 = -divisor.low;
		if(low1 == 0) {
			var ret1 = high1++;
			high1 = high1 | 0;
			ret1;
		}
		var x4 = new haxe__$Int64__$_$_$Int64(high1,low1);
		divisor = x4;
	} else divisor = divisor;
	var quotient;
	{
		var x5 = new haxe__$Int64__$_$_$Int64(0,0);
		quotient = x5;
	}
	var mask;
	{
		var x6 = new haxe__$Int64__$_$_$Int64(0,1);
		mask = x6;
	}
	while(!(divisor.high < 0)) {
		var cmp;
		var v = haxe__$Int32_Int32_$Impl_$.ucompare(divisor.high,modulus.high);
		if(v != 0) cmp = v; else cmp = haxe__$Int32_Int32_$Impl_$.ucompare(divisor.low,modulus.low);
		var b = 1;
		b &= 63;
		if(b == 0) {
			var x7 = new haxe__$Int64__$_$_$Int64(divisor.high,divisor.low);
			divisor = x7;
		} else if(b < 32) {
			var x8 = new haxe__$Int64__$_$_$Int64(divisor.high << b | divisor.low >>> 32 - b,divisor.low << b);
			divisor = x8;
		} else {
			var x9 = new haxe__$Int64__$_$_$Int64(divisor.low << b - 32,0);
			divisor = x9;
		}
		var b1 = 1;
		b1 &= 63;
		if(b1 == 0) {
			var x10 = new haxe__$Int64__$_$_$Int64(mask.high,mask.low);
			mask = x10;
		} else if(b1 < 32) {
			var x11 = new haxe__$Int64__$_$_$Int64(mask.high << b1 | mask.low >>> 32 - b1,mask.low << b1);
			mask = x11;
		} else {
			var x12 = new haxe__$Int64__$_$_$Int64(mask.low << b1 - 32,0);
			mask = x12;
		}
		if(cmp >= 0) break;
	}
	while((function($this) {
		var $r;
		var b2;
		{
			var x13 = new haxe__$Int64__$_$_$Int64(0,0);
			b2 = x13;
		}
		$r = mask.high != b2.high || mask.low != b2.low;
		return $r;
	}(this))) {
		if((function($this) {
			var $r;
			var v1 = haxe__$Int32_Int32_$Impl_$.ucompare(modulus.high,divisor.high);
			$r = v1 != 0?v1:haxe__$Int32_Int32_$Impl_$.ucompare(modulus.low,divisor.low);
			return $r;
		}(this)) >= 0) {
			var x14 = new haxe__$Int64__$_$_$Int64(quotient.high | mask.high,quotient.low | mask.low);
			quotient = x14;
			var high2 = modulus.high - divisor.high | 0;
			var low2 = modulus.low - divisor.low | 0;
			if(haxe__$Int32_Int32_$Impl_$.ucompare(modulus.low,divisor.low) < 0) {
				var ret2 = high2--;
				high2 = high2 | 0;
				ret2;
			}
			var x15 = new haxe__$Int64__$_$_$Int64(high2,low2);
			modulus = x15;
		}
		var b3 = 1;
		b3 &= 63;
		if(b3 == 0) {
			var x16 = new haxe__$Int64__$_$_$Int64(mask.high,mask.low);
			mask = x16;
		} else if(b3 < 32) {
			var x17 = new haxe__$Int64__$_$_$Int64(mask.high >>> b3,mask.high << 32 - b3 | mask.low >>> b3);
			mask = x17;
		} else {
			var x18 = new haxe__$Int64__$_$_$Int64(0,mask.high >>> b3 - 32);
			mask = x18;
		}
		var b4 = 1;
		b4 &= 63;
		if(b4 == 0) {
			var x19 = new haxe__$Int64__$_$_$Int64(divisor.high,divisor.low);
			divisor = x19;
		} else if(b4 < 32) {
			var x20 = new haxe__$Int64__$_$_$Int64(divisor.high >>> b4,divisor.high << 32 - b4 | divisor.low >>> b4);
			divisor = x20;
		} else {
			var x21 = new haxe__$Int64__$_$_$Int64(0,divisor.high >>> b4 - 32);
			divisor = x21;
		}
	}
	if(divSign) {
		var high3 = ~quotient.high;
		var low3 = -quotient.low;
		if(low3 == 0) {
			var ret3 = high3++;
			high3 = high3 | 0;
			ret3;
		}
		var x22 = new haxe__$Int64__$_$_$Int64(high3,low3);
		quotient = x22;
	}
	if(dividend.high < 0) {
		var high4 = ~modulus.high;
		var low4 = -modulus.low;
		if(low4 == 0) {
			var ret4 = high4++;
			high4 = high4 | 0;
			ret4;
		}
		var x23 = new haxe__$Int64__$_$_$Int64(high4,low4);
		modulus = x23;
	}
	return { quotient : quotient, modulus : modulus};
};
haxe__$Int64_Int64_$Impl_$.neg = function(x) {
	var high = ~x.high;
	var low = -x.low;
	if(low == 0) {
		var ret = high++;
		high = high | 0;
		ret;
	}
	var x1 = new haxe__$Int64__$_$_$Int64(high,low);
	return x1;
};
haxe__$Int64_Int64_$Impl_$.preIncrement = function(this1) {
	{
		var ret = this1.low++;
		this1.low = this1.low | 0;
		ret;
	}
	if(this1.low == 0) {
		var ret1 = this1.high++;
		this1.high = this1.high | 0;
		ret1;
	}
	return this1;
};
haxe__$Int64_Int64_$Impl_$.postIncrement = function(this1) {
	var ret;
	var x = new haxe__$Int64__$_$_$Int64(this1.high,this1.low);
	ret = x;
	{
		var ret1 = this1.low++;
		this1.low = this1.low | 0;
		ret1;
	}
	if(this1.low == 0) {
		var ret2 = this1.high++;
		this1.high = this1.high | 0;
		ret2;
	}
	this1;
	return ret;
};
haxe__$Int64_Int64_$Impl_$.preDecrement = function(this1) {
	if(this1.low == 0) {
		var ret = this1.high--;
		this1.high = this1.high | 0;
		ret;
	}
	{
		var ret1 = this1.low--;
		this1.low = this1.low | 0;
		ret1;
	}
	return this1;
};
haxe__$Int64_Int64_$Impl_$.postDecrement = function(this1) {
	var ret;
	var x = new haxe__$Int64__$_$_$Int64(this1.high,this1.low);
	ret = x;
	if(this1.low == 0) {
		var ret1 = this1.high--;
		this1.high = this1.high | 0;
		ret1;
	}
	{
		var ret2 = this1.low--;
		this1.low = this1.low | 0;
		ret2;
	}
	this1;
	return ret;
};
haxe__$Int64_Int64_$Impl_$.add = function(a,b) {
	var high = a.high + b.high | 0;
	var low = a.low + b.low | 0;
	if(haxe__$Int32_Int32_$Impl_$.ucompare(low,a.low) < 0) {
		var ret = high++;
		high = high | 0;
		ret;
	}
	var x = new haxe__$Int64__$_$_$Int64(high,low);
	return x;
};
haxe__$Int64_Int64_$Impl_$.addInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	var high = a.high + b1.high | 0;
	var low = a.low + b1.low | 0;
	if(haxe__$Int32_Int32_$Impl_$.ucompare(low,a.low) < 0) {
		var ret = high++;
		high = high | 0;
		ret;
	}
	var x1 = new haxe__$Int64__$_$_$Int64(high,low);
	return x1;
};
haxe__$Int64_Int64_$Impl_$.sub = function(a,b) {
	var high = a.high - b.high | 0;
	var low = a.low - b.low | 0;
	if(haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b.low) < 0) {
		var ret = high--;
		high = high | 0;
		ret;
	}
	var x = new haxe__$Int64__$_$_$Int64(high,low);
	return x;
};
haxe__$Int64_Int64_$Impl_$.subInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	var high = a.high - b1.high | 0;
	var low = a.low - b1.low | 0;
	if(haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b1.low) < 0) {
		var ret = high--;
		high = high | 0;
		ret;
	}
	var x1 = new haxe__$Int64__$_$_$Int64(high,low);
	return x1;
};
haxe__$Int64_Int64_$Impl_$.intSub = function(a,b) {
	var a1;
	{
		var x = new haxe__$Int64__$_$_$Int64(a >> 31,a);
		a1 = x;
	}
	var high = a1.high - b.high | 0;
	var low = a1.low - b.low | 0;
	if(haxe__$Int32_Int32_$Impl_$.ucompare(a1.low,b.low) < 0) {
		var ret = high--;
		high = high | 0;
		ret;
	}
	var x1 = new haxe__$Int64__$_$_$Int64(high,low);
	return x1;
};
haxe__$Int64_Int64_$Impl_$.mul = function(a,b) {
	var mask = 65535;
	var al = a.low & mask;
	var ah = a.low >>> 16;
	var bl = b.low & mask;
	var bh = b.low >>> 16;
	var p00 = haxe__$Int32_Int32_$Impl_$.mul(al,bl);
	var p10 = haxe__$Int32_Int32_$Impl_$.mul(ah,bl);
	var p01 = haxe__$Int32_Int32_$Impl_$.mul(al,bh);
	var p11 = haxe__$Int32_Int32_$Impl_$.mul(ah,bh);
	var low = p00;
	var high = (p11 + (p01 >>> 16) | 0) + (p10 >>> 16) | 0;
	p01 = p01 << 16;
	low = low + p01 | 0;
	if(haxe__$Int32_Int32_$Impl_$.ucompare(low,p01) < 0) {
		var ret = high++;
		high = high | 0;
		ret;
	}
	p10 = p10 << 16;
	low = low + p10 | 0;
	if(haxe__$Int32_Int32_$Impl_$.ucompare(low,p10) < 0) {
		var ret1 = high++;
		high = high | 0;
		ret1;
	}
	var b1;
	var a1 = haxe__$Int32_Int32_$Impl_$.mul(a.low,b.high);
	var b2 = haxe__$Int32_Int32_$Impl_$.mul(a.high,b.low);
	b1 = a1 + b2 | 0;
	high = high + b1 | 0;
	var x = new haxe__$Int64__$_$_$Int64(high,low);
	return x;
};
haxe__$Int64_Int64_$Impl_$.mulInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	var mask = 65535;
	var al = a.low & mask;
	var ah = a.low >>> 16;
	var bl = b1.low & mask;
	var bh = b1.low >>> 16;
	var p00 = haxe__$Int32_Int32_$Impl_$.mul(al,bl);
	var p10 = haxe__$Int32_Int32_$Impl_$.mul(ah,bl);
	var p01 = haxe__$Int32_Int32_$Impl_$.mul(al,bh);
	var p11 = haxe__$Int32_Int32_$Impl_$.mul(ah,bh);
	var low = p00;
	var high = (p11 + (p01 >>> 16) | 0) + (p10 >>> 16) | 0;
	p01 = p01 << 16;
	low = low + p01 | 0;
	if(haxe__$Int32_Int32_$Impl_$.ucompare(low,p01) < 0) {
		var ret = high++;
		high = high | 0;
		ret;
	}
	p10 = p10 << 16;
	low = low + p10 | 0;
	if(haxe__$Int32_Int32_$Impl_$.ucompare(low,p10) < 0) {
		var ret1 = high++;
		high = high | 0;
		ret1;
	}
	var b2;
	var a1 = haxe__$Int32_Int32_$Impl_$.mul(a.low,b1.high);
	var b3 = haxe__$Int32_Int32_$Impl_$.mul(a.high,b1.low);
	b2 = a1 + b3 | 0;
	high = high + b2 | 0;
	var x1 = new haxe__$Int64__$_$_$Int64(high,low);
	return x1;
};
haxe__$Int64_Int64_$Impl_$.div = function(a,b) {
	return haxe__$Int64_Int64_$Impl_$.divMod(a,b).quotient;
};
haxe__$Int64_Int64_$Impl_$.divInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	return haxe__$Int64_Int64_$Impl_$.divMod(a,b1).quotient;
};
haxe__$Int64_Int64_$Impl_$.intDiv = function(a,b) {
	{
		var x;
		var x2;
		var a1;
		{
			var x3 = new haxe__$Int64__$_$_$Int64(a >> 31,a);
			a1 = x3;
		}
		x2 = haxe__$Int64_Int64_$Impl_$.divMod(a1,b).quotient;
		if(x2.high != x2.low >> 31) throw new js__$Boot_HaxeError("Overflow");
		x = x2.low;
		var x1 = new haxe__$Int64__$_$_$Int64(x >> 31,x);
		return x1;
	}
};
haxe__$Int64_Int64_$Impl_$.mod = function(a,b) {
	return haxe__$Int64_Int64_$Impl_$.divMod(a,b).modulus;
};
haxe__$Int64_Int64_$Impl_$.modInt = function(a,b) {
	{
		var x;
		var x2;
		var b1;
		{
			var x3 = new haxe__$Int64__$_$_$Int64(b >> 31,b);
			b1 = x3;
		}
		x2 = haxe__$Int64_Int64_$Impl_$.divMod(a,b1).modulus;
		if(x2.high != x2.low >> 31) throw new js__$Boot_HaxeError("Overflow");
		x = x2.low;
		var x1 = new haxe__$Int64__$_$_$Int64(x >> 31,x);
		return x1;
	}
};
haxe__$Int64_Int64_$Impl_$.intMod = function(a,b) {
	{
		var x;
		var x2;
		var a1;
		{
			var x3 = new haxe__$Int64__$_$_$Int64(a >> 31,a);
			a1 = x3;
		}
		x2 = haxe__$Int64_Int64_$Impl_$.divMod(a1,b).modulus;
		if(x2.high != x2.low >> 31) throw new js__$Boot_HaxeError("Overflow");
		x = x2.low;
		var x1 = new haxe__$Int64__$_$_$Int64(x >> 31,x);
		return x1;
	}
};
haxe__$Int64_Int64_$Impl_$.eq = function(a,b) {
	return a.high == b.high && a.low == b.low;
};
haxe__$Int64_Int64_$Impl_$.eqInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	return a.high == b1.high && a.low == b1.low;
};
haxe__$Int64_Int64_$Impl_$.neq = function(a,b) {
	return a.high != b.high || a.low != b.low;
};
haxe__$Int64_Int64_$Impl_$.neqInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	return a.high != b1.high || a.low != b1.low;
};
haxe__$Int64_Int64_$Impl_$.lt = function(a,b) {
	return (function($this) {
		var $r;
		var v = a.high - b.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b.low);
		$r = a.high < 0?b.high < 0?v:-1:b.high >= 0?v:1;
		return $r;
	}(this)) < 0;
};
haxe__$Int64_Int64_$Impl_$.ltInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	return (function($this) {
		var $r;
		var v = a.high - b1.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b1.low);
		$r = a.high < 0?b1.high < 0?v:-1:b1.high >= 0?v:1;
		return $r;
	}(this)) < 0;
};
haxe__$Int64_Int64_$Impl_$.intLt = function(a,b) {
	var a1;
	{
		var x = new haxe__$Int64__$_$_$Int64(a >> 31,a);
		a1 = x;
	}
	return (function($this) {
		var $r;
		var v = a1.high - b.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a1.low,b.low);
		$r = a1.high < 0?b.high < 0?v:-1:b.high >= 0?v:1;
		return $r;
	}(this)) < 0;
};
haxe__$Int64_Int64_$Impl_$.lte = function(a,b) {
	return (function($this) {
		var $r;
		var v = a.high - b.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b.low);
		$r = a.high < 0?b.high < 0?v:-1:b.high >= 0?v:1;
		return $r;
	}(this)) <= 0;
};
haxe__$Int64_Int64_$Impl_$.lteInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	return (function($this) {
		var $r;
		var v = a.high - b1.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b1.low);
		$r = a.high < 0?b1.high < 0?v:-1:b1.high >= 0?v:1;
		return $r;
	}(this)) <= 0;
};
haxe__$Int64_Int64_$Impl_$.intLte = function(a,b) {
	var a1;
	{
		var x = new haxe__$Int64__$_$_$Int64(a >> 31,a);
		a1 = x;
	}
	return (function($this) {
		var $r;
		var v = a1.high - b.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a1.low,b.low);
		$r = a1.high < 0?b.high < 0?v:-1:b.high >= 0?v:1;
		return $r;
	}(this)) <= 0;
};
haxe__$Int64_Int64_$Impl_$.gt = function(a,b) {
	return (function($this) {
		var $r;
		var v = a.high - b.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b.low);
		$r = a.high < 0?b.high < 0?v:-1:b.high >= 0?v:1;
		return $r;
	}(this)) > 0;
};
haxe__$Int64_Int64_$Impl_$.gtInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	return (function($this) {
		var $r;
		var v = a.high - b1.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b1.low);
		$r = a.high < 0?b1.high < 0?v:-1:b1.high >= 0?v:1;
		return $r;
	}(this)) > 0;
};
haxe__$Int64_Int64_$Impl_$.intGt = function(a,b) {
	var a1;
	{
		var x = new haxe__$Int64__$_$_$Int64(a >> 31,a);
		a1 = x;
	}
	return (function($this) {
		var $r;
		var v = a1.high - b.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a1.low,b.low);
		$r = a1.high < 0?b.high < 0?v:-1:b.high >= 0?v:1;
		return $r;
	}(this)) > 0;
};
haxe__$Int64_Int64_$Impl_$.gte = function(a,b) {
	return (function($this) {
		var $r;
		var v = a.high - b.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b.low);
		$r = a.high < 0?b.high < 0?v:-1:b.high >= 0?v:1;
		return $r;
	}(this)) >= 0;
};
haxe__$Int64_Int64_$Impl_$.gteInt = function(a,b) {
	var b1;
	{
		var x = new haxe__$Int64__$_$_$Int64(b >> 31,b);
		b1 = x;
	}
	return (function($this) {
		var $r;
		var v = a.high - b1.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a.low,b1.low);
		$r = a.high < 0?b1.high < 0?v:-1:b1.high >= 0?v:1;
		return $r;
	}(this)) >= 0;
};
haxe__$Int64_Int64_$Impl_$.intGte = function(a,b) {
	var a1;
	{
		var x = new haxe__$Int64__$_$_$Int64(a >> 31,a);
		a1 = x;
	}
	return (function($this) {
		var $r;
		var v = a1.high - b.high | 0;
		if(v != 0) v = v; else v = haxe__$Int32_Int32_$Impl_$.ucompare(a1.low,b.low);
		$r = a1.high < 0?b.high < 0?v:-1:b.high >= 0?v:1;
		return $r;
	}(this)) >= 0;
};
haxe__$Int64_Int64_$Impl_$.complement = function(a) {
	var x = new haxe__$Int64__$_$_$Int64(~a.high,~a.low);
	return x;
};
haxe__$Int64_Int64_$Impl_$.and = function(a,b) {
	var x = new haxe__$Int64__$_$_$Int64(a.high & b.high,a.low & b.low);
	return x;
};
haxe__$Int64_Int64_$Impl_$.or = function(a,b) {
	var x = new haxe__$Int64__$_$_$Int64(a.high | b.high,a.low | b.low);
	return x;
};
haxe__$Int64_Int64_$Impl_$.xor = function(a,b) {
	var x = new haxe__$Int64__$_$_$Int64(a.high ^ b.high,a.low ^ b.low);
	return x;
};
haxe__$Int64_Int64_$Impl_$.shl = function(a,b) {
	b &= 63;
	if(b == 0) {
		var x = new haxe__$Int64__$_$_$Int64(a.high,a.low);
		return x;
	} else if(b < 32) {
		var x1 = new haxe__$Int64__$_$_$Int64(a.high << b | a.low >>> 32 - b,a.low << b);
		return x1;
	} else {
		var x2 = new haxe__$Int64__$_$_$Int64(a.low << b - 32,0);
		return x2;
	}
};
haxe__$Int64_Int64_$Impl_$.shr = function(a,b) {
	b &= 63;
	if(b == 0) {
		var x = new haxe__$Int64__$_$_$Int64(a.high,a.low);
		return x;
	} else if(b < 32) {
		var x1 = new haxe__$Int64__$_$_$Int64(a.high >> b,a.high << 32 - b | a.low >>> b);
		return x1;
	} else {
		var x2 = new haxe__$Int64__$_$_$Int64(a.high >> 31,a.high >> b - 32);
		return x2;
	}
};
haxe__$Int64_Int64_$Impl_$.ushr = function(a,b) {
	b &= 63;
	if(b == 0) {
		var x = new haxe__$Int64__$_$_$Int64(a.high,a.low);
		return x;
	} else if(b < 32) {
		var x1 = new haxe__$Int64__$_$_$Int64(a.high >>> b,a.high << 32 - b | a.low >>> b);
		return x1;
	} else {
		var x2 = new haxe__$Int64__$_$_$Int64(0,a.high >>> b - 32);
		return x2;
	}
};
haxe__$Int64_Int64_$Impl_$.get_high = function(this1) {
	return this1.high;
};
haxe__$Int64_Int64_$Impl_$.set_high = function(this1,x) {
	return this1.high = x;
};
haxe__$Int64_Int64_$Impl_$.get_low = function(this1) {
	return this1.low;
};
haxe__$Int64_Int64_$Impl_$.set_low = function(this1,x) {
	return this1.low = x;
};
var haxe__$Int64__$_$_$Int64 = function(high,low) {
	this.high = high;
	this.low = low;
};
$hxClasses["haxe._Int64.___Int64"] = haxe__$Int64__$_$_$Int64;
haxe__$Int64__$_$_$Int64.__name__ = ["haxe","_Int64","___Int64"];
haxe__$Int64__$_$_$Int64.prototype = {
	high: null
	,low: null
	,toString: function() {
		return haxe__$Int64_Int64_$Impl_$.toString(this);
	}
	,__class__: haxe__$Int64__$_$_$Int64
};
var haxe_Log = function() { };
$hxClasses["haxe.Log"] = haxe_Log;
haxe_Log.__name__ = ["haxe","Log"];
haxe_Log.trace = function(v,infos) {
	js_Boot.__trace(v,infos);
};
haxe_Log.clear = function() {
	js_Boot.__clear_trace();
};
var haxe_Unserializer = function(buf) {
	this.buf = buf;
	this.length = buf.length;
	this.pos = 0;
	this.scache = [];
	this.cache = [];
	var r = haxe_Unserializer.DEFAULT_RESOLVER;
	if(r == null) {
		r = Type;
		haxe_Unserializer.DEFAULT_RESOLVER = r;
	}
	this.setResolver(r);
};
$hxClasses["haxe.Unserializer"] = haxe_Unserializer;
haxe_Unserializer.__name__ = ["haxe","Unserializer"];
haxe_Unserializer.initCodes = function() {
	var codes = [];
	var _g1 = 0;
	var _g = haxe_Unserializer.BASE64.length;
	while(_g1 < _g) {
		var i = _g1++;
		codes[haxe_Unserializer.BASE64.charCodeAt(i)] = i;
	}
	return codes;
};
haxe_Unserializer.run = function(v) {
	return new haxe_Unserializer(v).unserialize();
};
haxe_Unserializer.prototype = {
	buf: null
	,pos: null
	,length: null
	,cache: null
	,scache: null
	,resolver: null
	,setResolver: function(r) {
		if(r == null) this.resolver = { resolveClass : function(_) {
			return null;
		}, resolveEnum : function(_1) {
			return null;
		}}; else this.resolver = r;
	}
	,getResolver: function() {
		return this.resolver;
	}
	,get: function(p) {
		return this.buf.charCodeAt(p);
	}
	,readDigits: function() {
		var k = 0;
		var s = false;
		var fpos = this.pos;
		while(true) {
			var c = this.buf.charCodeAt(this.pos);
			if(c != c) break;
			if(c == 45) {
				if(this.pos != fpos) break;
				s = true;
				this.pos++;
				continue;
			}
			if(c < 48 || c > 57) break;
			k = k * 10 + (c - 48);
			this.pos++;
		}
		if(s) k *= -1;
		return k;
	}
	,readFloat: function() {
		var p1 = this.pos;
		while(true) {
			var c = this.buf.charCodeAt(this.pos);
			if(c >= 43 && c < 58 || c == 101 || c == 69) this.pos++; else break;
		}
		return Std.parseFloat(HxOverrides.substr(this.buf,p1,this.pos - p1));
	}
	,unserializeObject: function(o) {
		while(true) {
			if(this.pos >= this.length) throw new js__$Boot_HaxeError("Invalid object");
			if(this.buf.charCodeAt(this.pos) == 103) break;
			var k = this.unserialize();
			if(!(typeof(k) == "string")) throw new js__$Boot_HaxeError("Invalid object key");
			var v = this.unserialize();
			o[k] = v;
		}
		this.pos++;
	}
	,unserializeEnum: function(edecl,tag) {
		if(this.get(this.pos++) != 58) throw new js__$Boot_HaxeError("Invalid enum format");
		var nargs = this.readDigits();
		if(nargs == 0) return Type.createEnum(edecl,tag);
		var args = [];
		while(nargs-- > 0) args.push(this.unserialize());
		return Type.createEnum(edecl,tag,args);
	}
	,unserialize: function() {
		var _g = this.get(this.pos++);
		switch(_g) {
		case 110:
			return null;
		case 116:
			return true;
		case 102:
			return false;
		case 122:
			return 0;
		case 105:
			return this.readDigits();
		case 100:
			return this.readFloat();
		case 121:
			var len = this.readDigits();
			if(this.get(this.pos++) != 58 || this.length - this.pos < len) throw new js__$Boot_HaxeError("Invalid string length");
			var s = HxOverrides.substr(this.buf,this.pos,len);
			this.pos += len;
			s = decodeURIComponent(s.split("+").join(" "));
			this.scache.push(s);
			return s;
		case 107:
			return NaN;
		case 109:
			return -Infinity;
		case 112:
			return Infinity;
		case 97:
			var buf = this.buf;
			var a = [];
			this.cache.push(a);
			while(true) {
				var c = this.buf.charCodeAt(this.pos);
				if(c == 104) {
					this.pos++;
					break;
				}
				if(c == 117) {
					this.pos++;
					var n = this.readDigits();
					a[a.length + n - 1] = null;
				} else a.push(this.unserialize());
			}
			return a;
		case 111:
			var o = { };
			this.cache.push(o);
			this.unserializeObject(o);
			return o;
		case 114:
			var n1 = this.readDigits();
			if(n1 < 0 || n1 >= this.cache.length) throw new js__$Boot_HaxeError("Invalid reference");
			return this.cache[n1];
		case 82:
			var n2 = this.readDigits();
			if(n2 < 0 || n2 >= this.scache.length) throw new js__$Boot_HaxeError("Invalid string reference");
			return this.scache[n2];
		case 120:
			throw new js__$Boot_HaxeError(this.unserialize());
			break;
		case 99:
			var name = this.unserialize();
			var cl = this.resolver.resolveClass(name);
			if(cl == null) throw new js__$Boot_HaxeError("Class not found " + name);
			var o1 = Type.createEmptyInstance(cl);
			this.cache.push(o1);
			this.unserializeObject(o1);
			return o1;
		case 119:
			var name1 = this.unserialize();
			var edecl = this.resolver.resolveEnum(name1);
			if(edecl == null) throw new js__$Boot_HaxeError("Enum not found " + name1);
			var e = this.unserializeEnum(edecl,this.unserialize());
			this.cache.push(e);
			return e;
		case 106:
			var name2 = this.unserialize();
			var edecl1 = this.resolver.resolveEnum(name2);
			if(edecl1 == null) throw new js__$Boot_HaxeError("Enum not found " + name2);
			this.pos++;
			var index = this.readDigits();
			var tag = Type.getEnumConstructs(edecl1)[index];
			if(tag == null) throw new js__$Boot_HaxeError("Unknown enum index " + name2 + "@" + index);
			var e1 = this.unserializeEnum(edecl1,tag);
			this.cache.push(e1);
			return e1;
		case 108:
			var l = new List();
			this.cache.push(l);
			var buf1 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) l.add(this.unserialize());
			this.pos++;
			return l;
		case 98:
			var h = new haxe_ds_StringMap();
			this.cache.push(h);
			var buf2 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) {
				var s1 = this.unserialize();
				h.set(s1,this.unserialize());
			}
			this.pos++;
			return h;
		case 113:
			var h1 = new haxe_ds_IntMap();
			this.cache.push(h1);
			var buf3 = this.buf;
			var c1 = this.get(this.pos++);
			while(c1 == 58) {
				var i = this.readDigits();
				h1.set(i,this.unserialize());
				c1 = this.get(this.pos++);
			}
			if(c1 != 104) throw new js__$Boot_HaxeError("Invalid IntMap format");
			return h1;
		case 77:
			var h2 = new haxe_ds_ObjectMap();
			this.cache.push(h2);
			var buf4 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) {
				var s2 = this.unserialize();
				h2.set(s2,this.unserialize());
			}
			this.pos++;
			return h2;
		case 118:
			var d;
			if(this.buf.charCodeAt(this.pos) >= 48 && this.buf.charCodeAt(this.pos) <= 57 && this.buf.charCodeAt(this.pos + 1) >= 48 && this.buf.charCodeAt(this.pos + 1) <= 57 && this.buf.charCodeAt(this.pos + 2) >= 48 && this.buf.charCodeAt(this.pos + 2) <= 57 && this.buf.charCodeAt(this.pos + 3) >= 48 && this.buf.charCodeAt(this.pos + 3) <= 57 && this.buf.charCodeAt(this.pos + 4) == 45) {
				var s3 = HxOverrides.substr(this.buf,this.pos,19);
				d = HxOverrides.strDate(s3);
				this.pos += 19;
			} else {
				var t = this.readFloat();
				var d1 = new Date();
				d1.setTime(t);
				d = d1;
			}
			this.cache.push(d);
			return d;
		case 115:
			var len1 = this.readDigits();
			var buf5 = this.buf;
			if(this.get(this.pos++) != 58 || this.length - this.pos < len1) throw new js__$Boot_HaxeError("Invalid bytes length");
			var codes = haxe_Unserializer.CODES;
			if(codes == null) {
				codes = haxe_Unserializer.initCodes();
				haxe_Unserializer.CODES = codes;
			}
			var i1 = this.pos;
			var rest = len1 & 3;
			var size;
			size = (len1 >> 2) * 3 + (rest >= 2?rest - 1:0);
			var max = i1 + (len1 - rest);
			var bytes = haxe_io_Bytes.alloc(size);
			var bpos = 0;
			while(i1 < max) {
				var c11 = codes[StringTools.fastCodeAt(buf5,i1++)];
				var c2 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c11 << 2 | c2 >> 4);
				var c3 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c2 << 4 | c3 >> 2);
				var c4 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c3 << 6 | c4);
			}
			if(rest >= 2) {
				var c12 = codes[StringTools.fastCodeAt(buf5,i1++)];
				var c21 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c12 << 2 | c21 >> 4);
				if(rest == 3) {
					var c31 = codes[StringTools.fastCodeAt(buf5,i1++)];
					bytes.set(bpos++,c21 << 4 | c31 >> 2);
				}
			}
			this.pos += len1;
			this.cache.push(bytes);
			return bytes;
		case 67:
			var name3 = this.unserialize();
			var cl1 = this.resolver.resolveClass(name3);
			if(cl1 == null) throw new js__$Boot_HaxeError("Class not found " + name3);
			var o2 = Type.createEmptyInstance(cl1);
			this.cache.push(o2);
			o2.hxUnserialize(this);
			if(this.get(this.pos++) != 103) throw new js__$Boot_HaxeError("Invalid custom data");
			return o2;
		case 65:
			var name4 = this.unserialize();
			var cl2 = this.resolver.resolveClass(name4);
			if(cl2 == null) throw new js__$Boot_HaxeError("Class not found " + name4);
			return cl2;
		case 66:
			var name5 = this.unserialize();
			var e2 = this.resolver.resolveEnum(name5);
			if(e2 == null) throw new js__$Boot_HaxeError("Enum not found " + name5);
			return e2;
		default:
		}
		this.pos--;
		throw new js__$Boot_HaxeError("Invalid char " + this.buf.charAt(this.pos) + " at position " + this.pos);
	}
	,__class__: haxe_Unserializer
};
var haxe_ds_BalancedTree = function() {
};
$hxClasses["haxe.ds.BalancedTree"] = haxe_ds_BalancedTree;
haxe_ds_BalancedTree.__name__ = ["haxe","ds","BalancedTree"];
haxe_ds_BalancedTree.prototype = {
	root: null
	,set: function(key,value) {
		this.root = this.setLoop(key,value,this.root);
	}
	,get: function(key) {
		var node = this.root;
		while(node != null) {
			var c = this.compare(key,node.key);
			if(c == 0) return node.value;
			if(c < 0) node = node.left; else node = node.right;
		}
		return null;
	}
	,remove: function(key) {
		try {
			this.root = this.removeLoop(key,this.root);
			return true;
		} catch( e ) {
			haxe_CallStack.lastException = e;
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			if( js_Boot.__instanceof(e,String) ) {
				return false;
			} else throw(e);
		}
	}
	,exists: function(key) {
		var node = this.root;
		while(node != null) {
			var c = this.compare(key,node.key);
			if(c == 0) return true; else if(c < 0) node = node.left; else node = node.right;
		}
		return false;
	}
	,iterator: function() {
		var ret = [];
		this.iteratorLoop(this.root,ret);
		return HxOverrides.iter(ret);
	}
	,keys: function() {
		var ret = [];
		this.keysLoop(this.root,ret);
		return HxOverrides.iter(ret);
	}
	,setLoop: function(k,v,node) {
		if(node == null) return new haxe_ds_TreeNode(null,k,v,null);
		var c = this.compare(k,node.key);
		if(c == 0) return new haxe_ds_TreeNode(node.left,k,v,node.right,node == null?0:node._height); else if(c < 0) {
			var nl = this.setLoop(k,v,node.left);
			return this.balance(nl,node.key,node.value,node.right);
		} else {
			var nr = this.setLoop(k,v,node.right);
			return this.balance(node.left,node.key,node.value,nr);
		}
	}
	,removeLoop: function(k,node) {
		if(node == null) throw new js__$Boot_HaxeError("Not_found");
		var c = this.compare(k,node.key);
		if(c == 0) return this.merge(node.left,node.right); else if(c < 0) return this.balance(this.removeLoop(k,node.left),node.key,node.value,node.right); else return this.balance(node.left,node.key,node.value,this.removeLoop(k,node.right));
	}
	,iteratorLoop: function(node,acc) {
		if(node != null) {
			this.iteratorLoop(node.left,acc);
			acc.push(node.value);
			this.iteratorLoop(node.right,acc);
		}
	}
	,keysLoop: function(node,acc) {
		if(node != null) {
			this.keysLoop(node.left,acc);
			acc.push(node.key);
			this.keysLoop(node.right,acc);
		}
	}
	,merge: function(t1,t2) {
		if(t1 == null) return t2;
		if(t2 == null) return t1;
		var t = this.minBinding(t2);
		return this.balance(t1,t.key,t.value,this.removeMinBinding(t2));
	}
	,minBinding: function(t) {
		if(t == null) throw new js__$Boot_HaxeError("Not_found"); else if(t.left == null) return t; else return this.minBinding(t.left);
	}
	,removeMinBinding: function(t) {
		if(t.left == null) return t.right; else return this.balance(this.removeMinBinding(t.left),t.key,t.value,t.right);
	}
	,balance: function(l,k,v,r) {
		var hl;
		if(l == null) hl = 0; else hl = l._height;
		var hr;
		if(r == null) hr = 0; else hr = r._height;
		if(hl > hr + 2) {
			if((function($this) {
				var $r;
				var _this = l.left;
				$r = _this == null?0:_this._height;
				return $r;
			}(this)) >= (function($this) {
				var $r;
				var _this1 = l.right;
				$r = _this1 == null?0:_this1._height;
				return $r;
			}(this))) return new haxe_ds_TreeNode(l.left,l.key,l.value,new haxe_ds_TreeNode(l.right,k,v,r)); else return new haxe_ds_TreeNode(new haxe_ds_TreeNode(l.left,l.key,l.value,l.right.left),l.right.key,l.right.value,new haxe_ds_TreeNode(l.right.right,k,v,r));
		} else if(hr > hl + 2) {
			if((function($this) {
				var $r;
				var _this2 = r.right;
				$r = _this2 == null?0:_this2._height;
				return $r;
			}(this)) > (function($this) {
				var $r;
				var _this3 = r.left;
				$r = _this3 == null?0:_this3._height;
				return $r;
			}(this))) return new haxe_ds_TreeNode(new haxe_ds_TreeNode(l,k,v,r.left),r.key,r.value,r.right); else return new haxe_ds_TreeNode(new haxe_ds_TreeNode(l,k,v,r.left.left),r.left.key,r.left.value,new haxe_ds_TreeNode(r.left.right,r.key,r.value,r.right));
		} else return new haxe_ds_TreeNode(l,k,v,r,(hl > hr?hl:hr) + 1);
	}
	,compare: function(k1,k2) {
		return Reflect.compare(k1,k2);
	}
	,toString: function() {
		if(this.root == null) return "{}"; else return "{" + this.root.toString() + "}";
	}
	,__class__: haxe_ds_BalancedTree
};
var haxe_ds_TreeNode = function(l,k,v,r,h) {
	if(h == null) h = -1;
	this.left = l;
	this.key = k;
	this.value = v;
	this.right = r;
	if(h == -1) this._height = ((function($this) {
		var $r;
		var _this = $this.left;
		$r = _this == null?0:_this._height;
		return $r;
	}(this)) > (function($this) {
		var $r;
		var _this1 = $this.right;
		$r = _this1 == null?0:_this1._height;
		return $r;
	}(this))?(function($this) {
		var $r;
		var _this2 = $this.left;
		$r = _this2 == null?0:_this2._height;
		return $r;
	}(this)):(function($this) {
		var $r;
		var _this3 = $this.right;
		$r = _this3 == null?0:_this3._height;
		return $r;
	}(this))) + 1; else this._height = h;
};
$hxClasses["haxe.ds.TreeNode"] = haxe_ds_TreeNode;
haxe_ds_TreeNode.__name__ = ["haxe","ds","TreeNode"];
haxe_ds_TreeNode.prototype = {
	left: null
	,right: null
	,key: null
	,value: null
	,_height: null
	,toString: function() {
		return (this.left == null?"":this.left.toString() + ", ") + ("" + Std.string(this.key) + "=" + Std.string(this.value)) + (this.right == null?"":", " + this.right.toString());
	}
	,__class__: haxe_ds_TreeNode
};
var haxe_ds_EnumValueMap = function() {
	haxe_ds_BalancedTree.call(this);
};
$hxClasses["haxe.ds.EnumValueMap"] = haxe_ds_EnumValueMap;
haxe_ds_EnumValueMap.__name__ = ["haxe","ds","EnumValueMap"];
haxe_ds_EnumValueMap.__interfaces__ = [haxe_IMap];
haxe_ds_EnumValueMap.__super__ = haxe_ds_BalancedTree;
haxe_ds_EnumValueMap.prototype = $extend(haxe_ds_BalancedTree.prototype,{
	compare: function(k1,k2) {
		var d = k1[1] - k2[1];
		if(d != 0) return d;
		var p1 = k1.slice(2);
		var p2 = k2.slice(2);
		if(p1.length == 0 && p2.length == 0) return 0;
		return this.compareArgs(p1,p2);
	}
	,compareArgs: function(a1,a2) {
		var ld = a1.length - a2.length;
		if(ld != 0) return ld;
		var _g1 = 0;
		var _g = a1.length;
		while(_g1 < _g) {
			var i = _g1++;
			var d = this.compareArg(a1[i],a2[i]);
			if(d != 0) return d;
		}
		return 0;
	}
	,compareArg: function(v1,v2) {
		if(Reflect.isEnumValue(v1) && Reflect.isEnumValue(v2)) return this.compare(v1,v2); else if((v1 instanceof Array) && v1.__enum__ == null && ((v2 instanceof Array) && v2.__enum__ == null)) return this.compareArgs(v1,v2); else return Reflect.compare(v1,v2);
	}
	,__class__: haxe_ds_EnumValueMap
});
var haxe_ds__$HashMap_HashMap_$Impl_$ = {};
$hxClasses["haxe.ds._HashMap.HashMap_Impl_"] = haxe_ds__$HashMap_HashMap_$Impl_$;
haxe_ds__$HashMap_HashMap_$Impl_$.__name__ = ["haxe","ds","_HashMap","HashMap_Impl_"];
haxe_ds__$HashMap_HashMap_$Impl_$._new = function() {
	return new haxe_ds__$HashMap_HashMapData();
};
haxe_ds__$HashMap_HashMap_$Impl_$.set = function(this1,k,v) {
	this1.keys.set(k.hashCode(),k);
	this1.values.set(k.hashCode(),v);
};
haxe_ds__$HashMap_HashMap_$Impl_$.get = function(this1,k) {
	return this1.values.get(k.hashCode());
};
haxe_ds__$HashMap_HashMap_$Impl_$.exists = function(this1,k) {
	return this1.values.exists(k.hashCode());
};
haxe_ds__$HashMap_HashMap_$Impl_$.remove = function(this1,k) {
	this1.values.remove(k.hashCode());
	return this1.keys.remove(k.hashCode());
};
haxe_ds__$HashMap_HashMap_$Impl_$.keys = function(this1) {
	return this1.keys.iterator();
};
haxe_ds__$HashMap_HashMap_$Impl_$.iterator = function(this1) {
	return this1.values.iterator();
};
var haxe_ds__$HashMap_HashMapData = function() {
	this.keys = new haxe_ds_IntMap();
	this.values = new haxe_ds_IntMap();
};
$hxClasses["haxe.ds._HashMap.HashMapData"] = haxe_ds__$HashMap_HashMapData;
haxe_ds__$HashMap_HashMapData.__name__ = ["haxe","ds","_HashMap","HashMapData"];
haxe_ds__$HashMap_HashMapData.prototype = {
	keys: null
	,values: null
	,__class__: haxe_ds__$HashMap_HashMapData
};
var haxe_ds_IntMap = function() {
	this.h = { };
};
$hxClasses["haxe.ds.IntMap"] = haxe_ds_IntMap;
haxe_ds_IntMap.__name__ = ["haxe","ds","IntMap"];
haxe_ds_IntMap.__interfaces__ = [haxe_IMap];
haxe_ds_IntMap.prototype = {
	h: null
	,set: function(key,value) {
		this.h[key] = value;
	}
	,get: function(key) {
		return this.h[key];
	}
	,exists: function(key) {
		return this.h.hasOwnProperty(key);
	}
	,remove: function(key) {
		if(!this.h.hasOwnProperty(key)) return false;
		delete(this.h[key]);
		return true;
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key | 0);
		}
		return HxOverrides.iter(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref[i];
		}};
	}
	,toString: function() {
		var s_b = "";
		s_b += "{";
		var it = this.keys();
		while( it.hasNext() ) {
			var i = it.next();
			if(i == null) s_b += "null"; else s_b += "" + i;
			s_b += " => ";
			s_b += Std.string(Std.string(this.h[i]));
			if(it.hasNext()) s_b += ", ";
		}
		s_b += "}";
		return s_b;
	}
	,__class__: haxe_ds_IntMap
};
var haxe_ds_ObjectMap = function() {
	this.h = { };
	this.h.__keys__ = { };
};
$hxClasses["haxe.ds.ObjectMap"] = haxe_ds_ObjectMap;
haxe_ds_ObjectMap.__name__ = ["haxe","ds","ObjectMap"];
haxe_ds_ObjectMap.__interfaces__ = [haxe_IMap];
haxe_ds_ObjectMap.assignId = function(obj) {
	return obj.__id__ = ++haxe_ds_ObjectMap.count;
};
haxe_ds_ObjectMap.getId = function(obj) {
	return obj.__id__;
};
haxe_ds_ObjectMap.prototype = {
	h: null
	,set: function(key,value) {
		var id = key.__id__ || (key.__id__ = ++haxe_ds_ObjectMap.count);
		this.h[id] = value;
		this.h.__keys__[id] = key;
	}
	,get: function(key) {
		return this.h[key.__id__];
	}
	,exists: function(key) {
		return this.h.__keys__[key.__id__] != null;
	}
	,remove: function(key) {
		var id = key.__id__;
		if(this.h.__keys__[id] == null) return false;
		delete(this.h[id]);
		delete(this.h.__keys__[id]);
		return true;
	}
	,keys: function() {
		var a = [];
		for( var key in this.h.__keys__ ) {
		if(this.h.hasOwnProperty(key)) a.push(this.h.__keys__[key]);
		}
		return HxOverrides.iter(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref[i.__id__];
		}};
	}
	,toString: function() {
		var s_b = "";
		s_b += "{";
		var it = this.keys();
		while( it.hasNext() ) {
			var i = it.next();
			s_b += Std.string(Std.string(i));
			s_b += " => ";
			s_b += Std.string(Std.string(this.h[i.__id__]));
			if(it.hasNext()) s_b += ", ";
		}
		s_b += "}";
		return s_b;
	}
	,__class__: haxe_ds_ObjectMap
};
var haxe_ds__$StringMap_StringMapIterator = function(map,keys) {
	this.map = map;
	this.keys = keys;
	this.index = 0;
	this.count = keys.length;
};
$hxClasses["haxe.ds._StringMap.StringMapIterator"] = haxe_ds__$StringMap_StringMapIterator;
haxe_ds__$StringMap_StringMapIterator.__name__ = ["haxe","ds","_StringMap","StringMapIterator"];
haxe_ds__$StringMap_StringMapIterator.prototype = {
	map: null
	,keys: null
	,index: null
	,count: null
	,hasNext: function() {
		return this.index < this.count;
	}
	,next: function() {
		return this.map.get(this.keys[this.index++]);
	}
	,__class__: haxe_ds__$StringMap_StringMapIterator
};
var haxe_ds_StringMap = function() {
	this.h = { };
};
$hxClasses["haxe.ds.StringMap"] = haxe_ds_StringMap;
haxe_ds_StringMap.__name__ = ["haxe","ds","StringMap"];
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
haxe_ds_StringMap.prototype = {
	h: null
	,rh: null
	,isReserved: function(key) {
		return __map_reserved[key] != null;
	}
	,set: function(key,value) {
		if(__map_reserved[key] != null) this.setReserved(key,value); else this.h[key] = value;
	}
	,get: function(key) {
		if(__map_reserved[key] != null) return this.getReserved(key);
		return this.h[key];
	}
	,exists: function(key) {
		if(__map_reserved[key] != null) return this.existsReserved(key);
		return this.h.hasOwnProperty(key);
	}
	,setReserved: function(key,value) {
		if(this.rh == null) this.rh = { };
		this.rh["$" + key] = value;
	}
	,getReserved: function(key) {
		if(this.rh == null) return null; else return this.rh["$" + key];
	}
	,existsReserved: function(key) {
		if(this.rh == null) return false;
		return this.rh.hasOwnProperty("$" + key);
	}
	,remove: function(key) {
		if(__map_reserved[key] != null) {
			key = "$" + key;
			if(this.rh == null || !this.rh.hasOwnProperty(key)) return false;
			delete(this.rh[key]);
			return true;
		} else {
			if(!this.h.hasOwnProperty(key)) return false;
			delete(this.h[key]);
			return true;
		}
	}
	,keys: function() {
		var _this = this.arrayKeys();
		return HxOverrides.iter(_this);
	}
	,arrayKeys: function() {
		var out = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) out.push(key);
		}
		if(this.rh != null) {
			for( var key in this.rh ) {
			if(key.charCodeAt(0) == 36) out.push(key.substr(1));
			}
		}
		return out;
	}
	,iterator: function() {
		return new haxe_ds__$StringMap_StringMapIterator(this,this.arrayKeys());
	}
	,toString: function() {
		var s = new StringBuf();
		s.b += "{";
		var keys = this.arrayKeys();
		var _g1 = 0;
		var _g = keys.length;
		while(_g1 < _g) {
			var i = _g1++;
			var k = keys[i];
			if(k == null) s.b += "null"; else s.b += "" + k;
			s.b += " => ";
			s.add(Std.string(__map_reserved[k] != null?this.getReserved(k):this.h[k]));
			if(i < keys.length) s.b += ", ";
		}
		s.b += "}";
		return s.b;
	}
	,__class__: haxe_ds_StringMap
};
var haxe_ds_WeakMap = function() {
	throw new js__$Boot_HaxeError("Not implemented for this platform");
};
$hxClasses["haxe.ds.WeakMap"] = haxe_ds_WeakMap;
haxe_ds_WeakMap.__name__ = ["haxe","ds","WeakMap"];
haxe_ds_WeakMap.__interfaces__ = [haxe_IMap];
haxe_ds_WeakMap.prototype = {
	set: function(key,value) {
	}
	,get: function(key) {
		return null;
	}
	,exists: function(key) {
		return false;
	}
	,remove: function(key) {
		return false;
	}
	,keys: function() {
		return null;
	}
	,iterator: function() {
		return null;
	}
	,toString: function() {
		return null;
	}
	,__class__: haxe_ds_WeakMap
};
var haxe_io_Bytes = function(data) {
	this.length = data.byteLength;
	this.b = new Uint8Array(data);
	this.b.bufferValue = data;
	data.hxBytes = this;
	data.bytes = this.b;
};
$hxClasses["haxe.io.Bytes"] = haxe_io_Bytes;
haxe_io_Bytes.__name__ = ["haxe","io","Bytes"];
haxe_io_Bytes.alloc = function(length) {
	return new haxe_io_Bytes(new ArrayBuffer(length));
};
haxe_io_Bytes.ofString = function(s) {
	var a = [];
	var i = 0;
	while(i < s.length) {
		var c = StringTools.fastCodeAt(s,i++);
		if(55296 <= c && c <= 56319) c = c - 55232 << 10 | StringTools.fastCodeAt(s,i++) & 1023;
		if(c <= 127) a.push(c); else if(c <= 2047) {
			a.push(192 | c >> 6);
			a.push(128 | c & 63);
		} else if(c <= 65535) {
			a.push(224 | c >> 12);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		} else {
			a.push(240 | c >> 18);
			a.push(128 | c >> 12 & 63);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		}
	}
	return new haxe_io_Bytes(new Uint8Array(a).buffer);
};
haxe_io_Bytes.ofData = function(b) {
	var hb = b.hxBytes;
	if(hb != null) return hb;
	return new haxe_io_Bytes(b);
};
haxe_io_Bytes.fastGet = function(b,pos) {
	return b.bytes[pos];
};
haxe_io_Bytes.prototype = {
	length: null
	,b: null
	,data: null
	,get: function(pos) {
		return this.b[pos];
	}
	,set: function(pos,v) {
		this.b[pos] = v & 255;
	}
	,blit: function(pos,src,srcpos,len) {
		if(pos < 0 || srcpos < 0 || len < 0 || pos + len > this.length || srcpos + len > src.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		if(srcpos == 0 && len == src.length) this.b.set(src.b,pos); else this.b.set(src.b.subarray(srcpos,srcpos + len),pos);
	}
	,fill: function(pos,len,value) {
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			this.set(pos++,value);
		}
	}
	,sub: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		return new haxe_io_Bytes(this.b.buffer.slice(pos + this.b.byteOffset,pos + this.b.byteOffset + len));
	}
	,compare: function(other) {
		var b1 = this.b;
		var b2 = other.b;
		var len;
		if(this.length < other.length) len = this.length; else len = other.length;
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			if(b1[i] != b2[i]) return b1[i] - b2[i];
		}
		return this.length - other.length;
	}
	,initData: function() {
		if(this.data == null) this.data = new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);
	}
	,getDouble: function(pos) {
		if(this.data == null) this.data = new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);
		return this.data.getFloat64(pos,true);
	}
	,getFloat: function(pos) {
		if(this.data == null) this.data = new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);
		return this.data.getFloat32(pos,true);
	}
	,setDouble: function(pos,v) {
		if(this.data == null) this.data = new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);
		this.data.setFloat64(pos,v,true);
	}
	,setFloat: function(pos,v) {
		if(this.data == null) this.data = new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);
		this.data.setFloat32(pos,v,true);
	}
	,getUInt16: function(pos) {
		if(this.data == null) this.data = new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);
		return this.data.getUint16(pos,true);
	}
	,setUInt16: function(pos,v) {
		if(this.data == null) this.data = new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);
		this.data.setUint16(pos,v,true);
	}
	,getInt32: function(pos) {
		if(this.data == null) this.data = new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);
		return this.data.getInt32(pos,true);
	}
	,setInt32: function(pos,v) {
		if(this.data == null) this.data = new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);
		this.data.setInt32(pos,v,true);
	}
	,getInt64: function(pos) {
		var high = this.getInt32(pos + 4);
		var low = this.getInt32(pos);
		var x = new haxe__$Int64__$_$_$Int64(high,low);
		return x;
	}
	,setInt64: function(pos,v) {
		this.setInt32(pos,v.low);
		this.setInt32(pos + 4,v.high);
	}
	,getString: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		var s = "";
		var b = this.b;
		var fcc = String.fromCharCode;
		var i = pos;
		var max = pos + len;
		while(i < max) {
			var c = b[i++];
			if(c < 128) {
				if(c == 0) break;
				s += fcc(c);
			} else if(c < 224) s += fcc((c & 63) << 6 | b[i++] & 127); else if(c < 240) {
				var c2 = b[i++];
				s += fcc((c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127);
			} else {
				var c21 = b[i++];
				var c3 = b[i++];
				var u = (c & 15) << 18 | (c21 & 127) << 12 | (c3 & 127) << 6 | b[i++] & 127;
				s += fcc((u >> 10) + 55232);
				s += fcc(u & 1023 | 56320);
			}
		}
		return s;
	}
	,readString: function(pos,len) {
		return this.getString(pos,len);
	}
	,toString: function() {
		return this.getString(0,this.length);
	}
	,toHex: function() {
		var s_b = "";
		var chars = [];
		var str = "0123456789abcdef";
		var _g1 = 0;
		var _g = str.length;
		while(_g1 < _g) {
			var i = _g1++;
			chars.push(HxOverrides.cca(str,i));
		}
		var _g11 = 0;
		var _g2 = this.length;
		while(_g11 < _g2) {
			var i1 = _g11++;
			var c = this.b[i1];
			s_b += String.fromCharCode(chars[c >> 4]);
			s_b += String.fromCharCode(chars[c & 15]);
		}
		return s_b;
	}
	,getData: function() {
		return this.b.bufferValue;
	}
	,__class__: haxe_io_Bytes
};
var haxe_io_Error = $hxClasses["haxe.io.Error"] = { __ename__ : ["haxe","io","Error"], __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe_io_Error.Blocked = ["Blocked",0];
haxe_io_Error.Blocked.toString = $estr;
haxe_io_Error.Blocked.__enum__ = haxe_io_Error;
haxe_io_Error.Overflow = ["Overflow",1];
haxe_io_Error.Overflow.toString = $estr;
haxe_io_Error.Overflow.__enum__ = haxe_io_Error;
haxe_io_Error.OutsideBounds = ["OutsideBounds",2];
haxe_io_Error.OutsideBounds.toString = $estr;
haxe_io_Error.OutsideBounds.__enum__ = haxe_io_Error;
haxe_io_Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe_io_Error; $x.toString = $estr; return $x; };
haxe_io_Error.__empty_constructs__ = [haxe_io_Error.Blocked,haxe_io_Error.Overflow,haxe_io_Error.OutsideBounds];
var haxe_io_FPHelper = function() { };
$hxClasses["haxe.io.FPHelper"] = haxe_io_FPHelper;
haxe_io_FPHelper.__name__ = ["haxe","io","FPHelper"];
haxe_io_FPHelper.i32ToFloat = function(i) {
	var sign = 1 - (i >>> 31 << 1);
	var exp = i >>> 23 & 255;
	var sig = i & 8388607;
	if(sig == 0 && exp == 0) return 0.0;
	return sign * (1 + Math.pow(2,-23) * sig) * Math.pow(2,exp - 127);
};
haxe_io_FPHelper.floatToI32 = function(f) {
	if(f == 0) return 0;
	var af;
	if(f < 0) af = -f; else af = f;
	var exp = Math.floor(Math.log(af) / 0.6931471805599453);
	if(exp < -127) exp = -127; else if(exp > 128) exp = 128;
	var sig = Math.round((af / Math.pow(2,exp) - 1) * 8388608) & 8388607;
	return (f < 0?-2147483648:0) | exp + 127 << 23 | sig;
};
haxe_io_FPHelper.i64ToDouble = function(low,high) {
	var sign = 1 - (high >>> 31 << 1);
	var exp = (high >> 20 & 2047) - 1023;
	var sig = (high & 1048575) * 4294967296. + (low >>> 31) * 2147483648. + (low & 2147483647);
	if(sig == 0 && exp == -1023) return 0.0;
	return sign * (1.0 + Math.pow(2,-52) * sig) * Math.pow(2,exp);
};
haxe_io_FPHelper.doubleToI64 = function(v) {
	var i64 = haxe_io_FPHelper.i64tmp;
	if(v == 0) {
		i64.low = 0;
		i64.high = 0;
	} else {
		var av;
		if(v < 0) av = -v; else av = v;
		var exp = Math.floor(Math.log(av) / 0.6931471805599453);
		var sig;
		var v1 = (av / Math.pow(2,exp) - 1) * 4503599627370496.;
		sig = Math.round(v1);
		var sig_l = sig | 0;
		var sig_h = sig / 4294967296.0 | 0;
		i64.low = sig_l;
		i64.high = (v < 0?-2147483648:0) | exp + 1023 << 20 | sig_h;
	}
	return i64;
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
$hxClasses["js._Boot.HaxeError"] = js__$Boot_HaxeError;
js__$Boot_HaxeError.__name__ = ["js","_Boot","HaxeError"];
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
	val: null
	,__class__: js__$Boot_HaxeError
});
var js_Boot = function() { };
$hxClasses["js.Boot"] = js_Boot;
js_Boot.__name__ = ["js","Boot"];
js_Boot.__unhtml = function(s) {
	return s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
};
js_Boot.__trace = function(v,i) {
	var msg;
	if(i != null) msg = i.fileName + ":" + i.lineNumber + ": "; else msg = "";
	msg += js_Boot.__string_rec(v,"");
	if(i != null && i.customParams != null) {
		var _g = 0;
		var _g1 = i.customParams;
		while(_g < _g1.length) {
			var v1 = _g1[_g];
			++_g;
			msg += "," + js_Boot.__string_rec(v1,"");
		}
	}
	var d;
	if(typeof(document) != "undefined" && (d = document.getElementById("haxe:trace")) != null) d.innerHTML += js_Boot.__unhtml(msg) + "<br/>"; else if(typeof console != "undefined" && console.log != null) console.log(msg);
};
js_Boot.__clear_trace = function() {
	var d = document.getElementById("haxe:trace");
	if(d != null) d.innerHTML = "";
};
js_Boot.isClass = function(o) {
	return o.__name__;
};
js_Boot.isEnum = function(e) {
	return e.__ename__;
};
js_Boot.getClass = function(o) {
	if((o instanceof Array) && o.__enum__ == null) return Array; else {
		var cl = o.__class__;
		if(cl != null) return cl;
		var name = js_Boot.__nativeClassName(o);
		if(name != null) return js_Boot.__resolveNativeClass(name);
		return null;
	}
};
js_Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str2 = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i1 = _g1++;
					if(i1 != 2) str2 += "," + js_Boot.__string_rec(o[i1],s); else str2 += js_Boot.__string_rec(o[i1],s);
				}
				return str2 + ")";
			}
			var l = o.length;
			var i;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			haxe_CallStack.lastException = e;
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
js_Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js_Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js_Boot.__interfLoop(cc.__super__,cl);
};
js_Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Array:
		return (o instanceof Array) && o.__enum__ == null;
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) return true;
				if(js_Boot.__interfLoop(js_Boot.getClass(o),cl)) return true;
			} else if(typeof(cl) == "object" && js_Boot.__isNativeObj(cl)) {
				if(o instanceof cl) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
};
js_Boot.__cast = function(o,t) {
	if(js_Boot.__instanceof(o,t)) return o; else throw new js__$Boot_HaxeError("Cannot cast " + Std.string(o) + " to " + Std.string(t));
};
js_Boot.__nativeClassName = function(o) {
	var name = js_Boot.__toStr.call(o).slice(8,-1);
	if(name == "Object" || name == "Function" || name == "Math" || name == "JSON") return null;
	return name;
};
js_Boot.__isNativeObj = function(o) {
	return js_Boot.__nativeClassName(o) != null;
};
js_Boot.__resolveNativeClass = function(name) {
	return $global[name];
};
var js_Browser = function() { };
$hxClasses["js.Browser"] = js_Browser;
js_Browser.__name__ = ["js","Browser"];
js_Browser.__properties__ = {get_supported:"get_supported",get_console:"get_console",get_navigator:"get_navigator",get_location:"get_location",get_document:"get_document",get_window:"get_window"}
js_Browser.get_window = function() {
	return window;
};
js_Browser.get_document = function() {
	return window.document;
};
js_Browser.get_location = function() {
	return window.location;
};
js_Browser.get_navigator = function() {
	return window.navigator;
};
js_Browser.get_console = function() {
	return window.console;
};
js_Browser.get_supported = function() {
	return typeof(window) != "undefined";
};
js_Browser.getLocalStorage = function() {
	try {
		var s = window.localStorage;
		s.getItem("");
		return s;
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
js_Browser.getSessionStorage = function() {
	try {
		var s = window.sessionStorage;
		s.getItem("");
		return s;
	} catch( e ) {
		haxe_CallStack.lastException = e;
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
js_Browser.createXMLHttpRequest = function() {
	if(typeof XMLHttpRequest != "undefined") return new XMLHttpRequest();
	if(typeof ActiveXObject != "undefined") return new ActiveXObject("Microsoft.XMLHTTP");
	throw new js__$Boot_HaxeError("Unable to create XMLHttpRequest object.");
};
js_Browser.alert = function(v) {
	window.alert(js_Boot.__string_rec(v,""));
};
var js_Lib = function() { };
$hxClasses["js.Lib"] = js_Lib;
js_Lib.__name__ = ["js","Lib"];
js_Lib.__properties__ = {get_undefined:"get_undefined"}
js_Lib.debug = function() {
	debugger;
};
js_Lib.alert = function(v) {
	alert(js_Boot.__string_rec(v,""));
};
js_Lib["eval"] = function(code) {
	return eval(code);
};
js_Lib.require = function(module) {
	return require(module);
};
js_Lib.get_undefined = function() {
	return undefined;
};
var js_html__$CanvasElement_CanvasUtil = function() { };
$hxClasses["js.html._CanvasElement.CanvasUtil"] = js_html__$CanvasElement_CanvasUtil;
js_html__$CanvasElement_CanvasUtil.__name__ = ["js","html","_CanvasElement","CanvasUtil"];
js_html__$CanvasElement_CanvasUtil.getContextWebGL = function(canvas,attribs) {
	var _g = 0;
	var _g1 = ["webgl","experimental-webgl"];
	while(_g < _g1.length) {
		var name = _g1[_g];
		++_g;
		var ctx = canvas.getContext(name,attribs);
		if(ctx != null) return ctx;
	}
	return null;
};
var js_html_compat_ArrayBuffer = function(a) {
	if((a instanceof Array) && a.__enum__ == null) {
		this.a = a;
		this.byteLength = a.length;
	} else {
		var len = a;
		this.a = [];
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			this.a[i] = 0;
		}
		this.byteLength = len;
	}
};
$hxClasses["js.html.compat.ArrayBuffer"] = js_html_compat_ArrayBuffer;
js_html_compat_ArrayBuffer.__name__ = ["js","html","compat","ArrayBuffer"];
js_html_compat_ArrayBuffer.sliceImpl = function(begin,end) {
	var u = new Uint8Array(this,begin,end == null?null:end - begin);
	var result = new ArrayBuffer(u.byteLength);
	var resultArray = new Uint8Array(result);
	resultArray.set(u);
	return result;
};
js_html_compat_ArrayBuffer.prototype = {
	byteLength: null
	,a: null
	,slice: function(begin,end) {
		return new js_html_compat_ArrayBuffer(this.a.slice(begin,end));
	}
	,__class__: js_html_compat_ArrayBuffer
};
var js_html_compat_DataView = function(buffer,byteOffset,byteLength) {
	this.buf = buffer;
	if(byteOffset == null) this.offset = 0; else this.offset = byteOffset;
	if(byteLength == null) this.length = buffer.byteLength - this.offset; else this.length = byteLength;
	if(this.offset < 0 || this.length < 0 || this.offset + this.length > buffer.byteLength) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
};
$hxClasses["js.html.compat.DataView"] = js_html_compat_DataView;
js_html_compat_DataView.__name__ = ["js","html","compat","DataView"];
js_html_compat_DataView.prototype = {
	buf: null
	,offset: null
	,length: null
	,getInt8: function(byteOffset) {
		var v = this.buf.a[this.offset + byteOffset];
		if(v >= 128) return v - 256; else return v;
	}
	,getUint8: function(byteOffset) {
		return this.buf.a[this.offset + byteOffset];
	}
	,getInt16: function(byteOffset,littleEndian) {
		var v = this.getUint16(byteOffset,littleEndian);
		if(v >= 32768) return v - 65536; else return v;
	}
	,getUint16: function(byteOffset,littleEndian) {
		if(littleEndian) return this.buf.a[this.offset + byteOffset] | this.buf.a[this.offset + byteOffset + 1] << 8; else return this.buf.a[this.offset + byteOffset] << 8 | this.buf.a[this.offset + byteOffset + 1];
	}
	,getInt32: function(byteOffset,littleEndian) {
		var p = this.offset + byteOffset;
		var a = this.buf.a[p++];
		var b = this.buf.a[p++];
		var c = this.buf.a[p++];
		var d = this.buf.a[p++];
		if(littleEndian) return a | b << 8 | c << 16 | d << 24; else return d | c << 8 | b << 16 | a << 24;
	}
	,getUint32: function(byteOffset,littleEndian) {
		var v = this.getInt32(byteOffset,littleEndian);
		if(v < 0) return v + 4294967296.; else return v;
	}
	,getFloat32: function(byteOffset,littleEndian) {
		return haxe_io_FPHelper.i32ToFloat(this.getInt32(byteOffset,littleEndian));
	}
	,getFloat64: function(byteOffset,littleEndian) {
		var a = this.getInt32(byteOffset,littleEndian);
		var b = this.getInt32(byteOffset + 4,littleEndian);
		return haxe_io_FPHelper.i64ToDouble(littleEndian?a:b,littleEndian?b:a);
	}
	,setInt8: function(byteOffset,value) {
		if(value < 0) this.buf.a[byteOffset + this.offset] = value + 128 & 255; else this.buf.a[byteOffset + this.offset] = value & 255;
	}
	,setUint8: function(byteOffset,value) {
		this.buf.a[byteOffset + this.offset] = value & 255;
	}
	,setInt16: function(byteOffset,value,littleEndian) {
		this.setUint16(byteOffset,value < 0?value + 65536:value,littleEndian);
	}
	,setUint16: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
		} else {
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p] = value & 255;
		}
	}
	,setInt32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,value,littleEndian);
	}
	,setUint32: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p++] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >>> 24;
		} else {
			this.buf.a[p++] = value >>> 24;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value & 255;
		}
	}
	,setFloat32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,haxe_io_FPHelper.floatToI32(value),littleEndian);
	}
	,setFloat64: function(byteOffset,value,littleEndian) {
		var i64 = haxe_io_FPHelper.doubleToI64(value);
		if(littleEndian) {
			this.setUint32(byteOffset,i64.low);
			this.setUint32(byteOffset,i64.high);
		} else {
			this.setUint32(byteOffset,i64.high);
			this.setUint32(byteOffset,i64.low);
		}
	}
	,__class__: js_html_compat_DataView
};
var js_html_compat_Uint8Array = function() { };
$hxClasses["js.html.compat.Uint8Array"] = js_html_compat_Uint8Array;
js_html_compat_Uint8Array.__name__ = ["js","html","compat","Uint8Array"];
js_html_compat_Uint8Array._new = function(arg1,offset,length) {
	var arr;
	if(typeof(arg1) == "number") {
		arr = [];
		var _g = 0;
		while(_g < arg1) {
			var i = _g++;
			arr[i] = 0;
		}
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else if(js_Boot.__instanceof(arg1,js_html_compat_ArrayBuffer)) {
		var buffer = arg1;
		if(offset == null) offset = 0;
		if(length == null) length = buffer.byteLength - offset;
		if(offset == 0) arr = buffer.a; else arr = buffer.a.slice(offset,offset + length);
		arr.byteLength = arr.length;
		arr.byteOffset = offset;
		arr.buffer = buffer;
	} else if((arg1 instanceof Array) && arg1.__enum__ == null) {
		arr = arg1.slice();
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else throw new js__$Boot_HaxeError("TODO " + Std.string(arg1));
	arr.subarray = js_html_compat_Uint8Array._subarray;
	arr.set = js_html_compat_Uint8Array._set;
	return arr;
};
js_html_compat_Uint8Array._set = function(arg,offset) {
	var t = this;
	if(js_Boot.__instanceof(arg.buffer,js_html_compat_ArrayBuffer)) {
		var a = arg;
		if(arg.byteLength + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g1 = 0;
		var _g = arg.byteLength;
		while(_g1 < _g) {
			var i = _g1++;
			t[i + offset] = a[i];
		}
	} else if((arg instanceof Array) && arg.__enum__ == null) {
		var a1 = arg;
		if(a1.length + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g11 = 0;
		var _g2 = a1.length;
		while(_g11 < _g2) {
			var i1 = _g11++;
			t[i1 + offset] = a1[i1];
		}
	} else throw new js__$Boot_HaxeError("TODO");
};
js_html_compat_Uint8Array._subarray = function(start,end) {
	var t = this;
	var a = js_html_compat_Uint8Array._new(t.slice(start,end));
	a.byteOffset = start;
	return a;
};
var sugoi_form_filters_Filter = function() {
};
$hxClasses["sugoi.form.filters.Filter"] = sugoi_form_filters_Filter;
sugoi_form_filters_Filter.__name__ = ["sugoi","form","filters","Filter"];
sugoi_form_filters_Filter.prototype = {
	__class__: sugoi_form_filters_Filter
};
var sugoi_form_filters_IFilter = function() { };
$hxClasses["sugoi.form.filters.IFilter"] = sugoi_form_filters_IFilter;
sugoi_form_filters_IFilter.__name__ = ["sugoi","form","filters","IFilter"];
sugoi_form_filters_IFilter.prototype = {
	filter: null
	,__class__: sugoi_form_filters_IFilter
};
var sugoi_form_filters_FloatFilter = function() {
	sugoi_form_filters_Filter.call(this);
};
$hxClasses["sugoi.form.filters.FloatFilter"] = sugoi_form_filters_FloatFilter;
sugoi_form_filters_FloatFilter.__name__ = ["sugoi","form","filters","FloatFilter"];
sugoi_form_filters_FloatFilter.__interfaces__ = [sugoi_form_filters_IFilter];
sugoi_form_filters_FloatFilter.__super__ = sugoi_form_filters_Filter;
sugoi_form_filters_FloatFilter.prototype = $extend(sugoi_form_filters_Filter.prototype,{
	filter: function(n) {
		if(n == null || n == "") return null;
		n = StringTools.trim(n);
		n = StringTools.replace(n,",",".");
		return parseFloat(n);
	}
	,__class__: sugoi_form_filters_FloatFilter
});
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
function $arrayPushClosure(a) { return function(x) { a.push(x); }; }
if(Array.prototype.indexOf) HxOverrides.indexOf = function(a,o,i) {
	return Array.prototype.indexOf.call(a,o,i);
};
if(Array.prototype.lastIndexOf) HxOverrides.lastIndexOf = function(a1,o1,i1) {
	return Array.prototype.lastIndexOf.call(a1,o1,i1);
};
$hxClasses.Math = Math;
String.prototype.__class__ = $hxClasses.String = String;
String.__name__ = ["String"];
$hxClasses.Array = Array;
Array.__name__ = ["Array"];
Date.prototype.__class__ = $hxClasses.Date = Date;
Date.__name__ = ["Date"];
var Int = $hxClasses.Int = { __name__ : ["Int"]};
var Dynamic = $hxClasses.Dynamic = { __name__ : ["Dynamic"]};
var Float = $hxClasses.Float = Number;
Float.__name__ = ["Float"];
var Bool = $hxClasses.Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = $hxClasses.Class = { __name__ : ["Class"]};
var Enum = { };
var Void = $hxClasses.Void = { __ename__ : ["Void"]};
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
if(Array.prototype.filter == null) Array.prototype.filter = function(f1) {
	var a1 = [];
	var _g11 = 0;
	var _g2 = this.length;
	while(_g11 < _g2) {
		var i1 = _g11++;
		var e = this[i1];
		if(f1(e)) a1.push(e);
	}
	return a1;
};
var __map_reserved = {}
var q = window.jQuery;
var js = js || {}
js.JQuery = q;
q.fn.iterator = function() {
	return { pos : 0, j : this, hasNext : function() {
		return this.pos < this.j.length;
	}, next : function() {
		return $(this.j[this.pos++]);
	}};
};
var ArrayBuffer = $global.ArrayBuffer || js_html_compat_ArrayBuffer;
if(ArrayBuffer.prototype.slice == null) ArrayBuffer.prototype.slice = js_html_compat_ArrayBuffer.sliceImpl;
var DataView = $global.DataView || js_html_compat_DataView;
var Uint8Array = $global.Uint8Array || js_html_compat_Uint8Array._new;
Data.TUTOS = (function($this) {
	var $r;
	var _g = new haxe_ds_StringMap();
	{
		var value = { name : "Visite guidée coordinateur", steps : [{ element : null, text : "<p>Afin de mieux découvrir Cagette.net, nous vous proposons de faire une visite guidée de l'interface du logiciel.\r\n\t\t\t\t\t<br/> Vous aurez ainsi une vue d'ensemble sur les différents outils qui sont à votre disposition.</p>\r\n\t\t\t\t\t<p>Vous pourrez stopper et reprendre ce tutoriel quand vous le souhaitez.</p>", action : TutoAction.TANext, placement : null},{ element : "ul.nav.navbar-left", text : "Cette partie de la barre de navigation est visible par tout les adhérents.</br>\r\n\t\t\t\t\tElle permet d'accéder aux trois rubriques principales :\r\n\t\t\t\t\t<ul>\r\n\t\t\t\t\t\t<li> La <b>page d'accueil</b> qui permet d'accéder aux commandes et de voir son planning de livraison.</li>\r\n\t\t\t\t\t\t<li> La page <b>Mon compte</b> pour mettre à jour mes coordonnées et consulter mon historique de commande</li>\r\n\t\t\t\t\t\t<li> La page <b>Mon groupe</b> pour connaître les différents producteurs et coordinateurs de mon groupe\r\n\t\t\t\t\t</ul>", action : TutoAction.TANext, placement : TutoPlacement.TPBottom},{ element : "ul.nav.navbar-right", text : "Cette partie est exclusivement réservée <b>aux coordinateurs.</b>\r\n\t\t\t\t\tC'est là que vous allez pouvoir administrer les fiches d'adhérents, les commandes, les produits ...etc<br/>\r\n\t\t\t\t\t<p>Cliquez maintenant sur <b>Gestion adhérents</b></p>\r\n\t\t\t\t\t", action : TutoAction.TAPage("/member"), placement : TutoPlacement.TPBottom},{ element : ".article .table td:first", text : "Cette rubrique permet d'administrer la liste des adhérents.<br/>\r\n\t\t\t\t\tA chaque fois que vous saisissez un nouvel adhérent, un compte est créé à son nom. \r\n\t\t\t\t\tIl pourra donc se connecter à Cagette.net pour faire des commandes ou consulter son planning de livraison.\r\n\t\t\t\t\t<p>Cliquez maintenant sur <b>un adhérent</b></p>", action : TutoAction.TAPage("/member/view/*"), placement : TutoPlacement.TPRight},{ element : ".article:first", text : "Nous sommes maintenant sur la fiche d'un adhérent. Ici vous pourrez :\r\n\t\t\t\t\t<ul>\r\n\t\t\t\t\t<li>voir ou modifier ses coordonnées</li>\r\n\t\t\t\t\t<li>gérer ses cotisations à votre association</li>\r\n\t\t\t\t\t<li>voir un récapitulatif de ses commandes</li>\r\n\t\t\t\t\t</ul>", action : TutoAction.TANext, placement : TutoPlacement.TPRight},{ element : "ul.nav #contractadmin", text : "Allons voir maintenant la page de gestion des <b>contrats</b> qui est très importante pour les coordinateurs.", action : TutoAction.TAPage("/contractAdmin"), placement : TutoPlacement.TPBottom},{ element : "#contracts", text : "Ici se trouve la liste des <b>contrats</b>. \r\n\t\t\t\t\tIls comportent une date de début et date de fin et représentent votre relation avec un producteur. <br/>\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\tC'est ici que vous pourrez gérer :\r\n\t\t\t\t\t\t<ul>\r\n\t\t\t\t\t\t<li>la liste de produits de ce producteur</li>\r\n\t\t\t\t\t\t<li>les commandes des adhérents pour ce producteur</li>\r\n\t\t\t\t\t\t<li>planifier les livraisons</li>\r\n\t\t\t\t\t\t</ul>\r\n\t\t\t\t\t</p>", action : TutoAction.TANext, placement : TutoPlacement.TPBottom},{ element : "#vendors", text : "Ici vous pouvez gérer la liste des <b>producteurs ou fournisseurs</b> avec lesquels vous collaborez.<br/>\r\n\t\t\t\t\tRemplissez une fiche complète pour chacun d'eux afin d'informer au mieux les adhérents", action : TutoAction.TANext, placement : TutoPlacement.TPTop},{ element : "#places", text : "Ici vous pouvez gérer la liste des <b>lieux de livraison/distribution</b>.<br/>\r\n\t\t\t\t\tN'oubliez pas de mettre l'adresse complète car une carte s'affiche à partir de l'adresse du lieu.", action : TutoAction.TANext, placement : TutoPlacement.TPTop},{ element : "#contracts table .btn:first", text : "Allons voir maintenant de plus près comment administrer un contrat. <b>Cliquez sur ce bouton</b>", action : TutoAction.TAPage("/contractAdmin/view/*"), placement : TutoPlacement.TPBottom},{ element : ".table.table-bordered:first", text : "Ici vous avez un récapitulatif du contrat.<br/>Il y a deux types de contrats : <ul>\r\n\t\t\t\t\t<li>Les contrats AMAP : l'adhérent s'engage sur toute la durée du contrat avec une commande fixe.</li>\r\n\t\t\t\t\t<li>Les contrats à commande variable : l'adhérent peut commander ce qu'il veut à chaque livraison.</li>\r\n\t\t\t\t\t</ul>", action : TutoAction.TANext, placement : TutoPlacement.TPRight},{ element : "#subnav #products", text : "Allons voir maintenant la page de gestion des <b>Produits</b>", action : TutoAction.TAPage("/contractAdmin/products/*"), placement : TutoPlacement.TPRight},{ element : ".article .table", text : "Sur cette page, vous pouvez gérer la liste des produits proposée par ce producteur.<br/>\r\n\t\t\t\t\tDéfinissez au minimum le nom et le prix de vente des produits. Il est également possible d'ajouter un descriptif et une photo.", action : TutoAction.TANext, placement : TutoPlacement.TPTop},{ element : "#subnav #deliveries", text : "Allons voir maintenant la page de gestion des <b>livraisons</b>", action : TutoAction.TAPage("/contractAdmin/distributions/*"), placement : TutoPlacement.TPRight},{ element : ".article .table", text : "Ici nous pouvons gérer la liste des livraisons/distributions pour ce producteur<br/>\r\n\t\t\t\t\tDans le logiciel une livraison comporte une date avec une heure de début et heure de fin de livraison. \r\n\t\t\t\t\tIl faut aussi préciser le lieu de livraison à partir de la liste que nous avons vue précédement.", action : TutoAction.TANext, placement : TutoPlacement.TPLeft},{ element : "#subnav #orders", text : "Allons voir maintenant la page de gestion des <b>commandes</b>", action : TutoAction.TAPage("/contractAdmin/orders/*"), placement : TutoPlacement.TPRight},{ element : ".article .table", text : "Ici nous pouvons gérer la liste des commandes relatives à ce producteur.<br/>\r\n\t\t\t\t\tSi vous choisissez \"d'ouvrir les commandes\" aux adhérents, ils pourront eux-même saisir leur commande en se connectant à Cagette.net.<br/>\r\n\t\t\t\t\tCette page centralisera automatiquement les commandes pour ce producteur. \r\n\t\t\t\t\tSinon vous pouvez en tant que coordinateur saisir les commandes pour les adhérents depuis cette page.", action : TutoAction.TANext, placement : TutoPlacement.TPLeft},{ element : "ul.nav #messages", text : "<p>Nous avons vu l'essentiel en ce qui concerne les contrats.</p><p>Explorons maintenant la messagerie.</p>", action : TutoAction.TAPage("/messages"), placement : TutoPlacement.TPBottom},{ element : null, text : "<p>La messagerie vous permet d'envoyer des emails à différentes listes d'adhérents.\r\n\t\t\t\t\tIl n'est plus nécéssaire de maintenir de nombreuses listes d'emails en fonction des contrats, toutes ces listes\r\n\t\t\t\t\tsont gérées automatiquement.</p>\r\n\t\t\t\t\t<p>Les emails sont envoyés avec votre adresse email en tant qu'expéditeur, vous recevrez donc les réponses sur votre boite email habituelle.</p<\r\n\t\t\t\t\t", action : TutoAction.TANext, placement : null},{ element : "ul.nav #amapadmin", text : "Cliquez maintenant sur cette rubrique", action : TutoAction.TAPage("/amapadmin"), placement : TutoPlacement.TPBottom},{ element : "#subnav", text : "<p>Dans cette dernière rubrique, vous pouvez configurer tout ce qui concerne votre groupe en général.</p>\r\n\t\t\t\t\t<p>La rubrique <b>Droits et accès</b> est importante puisque c'est là que vous pourrez nommer d'autres coordinateurs parmi les adhérents. Ils pourront\r\n\t\t\t\t\tainsi gérer les contrats dont ils s'occupent, utiliser la messagerie ...etc\r\n\t\t\t\t\t</p>", action : TutoAction.TANext, placement : TutoPlacement.TPBottom},{ element : "#footer", text : "<p>C'est la dernière étape de ce tutoriel, j'espère qu'il vous aura donné une bonne vue d'ensemble du logiciel.<br/>\r\n\t\t\t\t\tPour aller plus loin, n'hésitez pas à consulter la <b>documentation</b> dont le lien est toujours disponible en bas de l'écran.\r\n\t\t\t\t\t</p>", action : TutoAction.TANext, placement : TutoPlacement.TPBottom}]};
		if(__map_reserved.intro != null) _g.setReserved("intro",value); else _g.h["intro"] = value;
	}
	$r = _g;
	return $r;
}(this));
Tuto.LAST_ELEMENT = null;
haxe_Unserializer.DEFAULT_RESOLVER = Type;
haxe_Unserializer.BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%:";
haxe_Unserializer.CODES = null;
haxe_ds_ObjectMap.count = 0;
haxe_io_FPHelper.i64tmp = (function($this) {
	var $r;
	var x = new haxe__$Int64__$_$_$Int64(0,0);
	$r = x;
	return $r;
}(this));
haxe_io_FPHelper.LN2 = 0.6931471805599453;
js_Boot.__toStr = {}.toString;
js_html_compat_Uint8Array.BYTES_PER_ELEMENT = 1;
App.main();
})(typeof console != "undefined" ? console : {log:function(){}}, typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this);
