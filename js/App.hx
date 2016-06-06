import js.JQuery;

class App {
	
	function new() { }	

	/**
	 * Returns a jquery object like $() in javascript
	 */
	public static inline function j(r:Dynamic) {
		return new JQuery(r);
	}

	/**
	 * The JS App will be available as "_" in the document.
	 */
	public static function main() {		
		untyped js.Browser.window._ = new App();
	}
	
	public function getCart() {
		return new Cart();
	}
	
	public function getTagger(cid:Int ) {
		return new Tagger(cid);
	}
	
	public function getTuto(name:String, step:Int) {	
		return new Tuto(name,step);		
	}
	
	
	public static function roundTo(n:Float, r:Int):Float {
		return Math.round(n * Math.pow(10,r)) / Math.pow(10,r) ;
	}

	
	/**
	 * Ajax loads a page and display it in a modal window
	 * @param	url
	 * @param	title
	 */
	public function overlay(url:String,?title,?large=true) {
	
		
		var r = new haxe.Http(url);
		r.onData = function(data) {
			
			//setup body and title
			var m = App.j("#myModal");
			m.find(".modal-body").html(data);			
			if (title != null) m.find(".modal-title").html(title);
			
			if (!large) m.find(".modal-dialog").removeClass("modal-lg");
			
			
			untyped App.j('#myModal').modal(); //bootstrap 3 modal window
			
		}
		r.request();
	}

	
	
}
