package;
import Common;

/**
 * Tutorial javascript widget 
 * @author fbarbut<francois.barbut@gmail.com>
 */
class Tuto
{
	var name:String;
	var step:Int;
	
	static var LAST_ELEMENT :String = null; //last hightlit element
	
	public function new(name:String,step:Int) 
	{
		this.name = name;
		this.step = step;
		
		var tuto = Data.TUTOS.get(name);
		var s = tuto.steps[step];
		
		//close previous popovers
		var p = App.j(".popover");
		untyped p.popover('hide');
		
		
		
		if (s == null) {
			//tutorial is finished : display a modal 
			
			//js.Browser.alert("Invalid Tutorial step : " + step + "@" + name);
			var m = App.j('#myModal');
			untyped m.modal('show');
			m.addClass("help");			
			m.find(".modal-header").html("<span class='glyphicon glyphicon-hand-right'></span> "+tuto.name);
			m.find(".modal-body").html("<span class='glyphicon glyphicon-ok'></span> Ce tutoriel est terminé."); 
			var bt = App.j("<a class='btn btn-default'><span class='glyphicon glyphicon-chevron-right'></span> Revenir à la page des tutoriels</a>");
			bt.click(function(?_) {
				untyped m.modal('hide');
				js.Browser.location.href = "/contract?stopTuto=1";
			});
			m.find(".modal-footer").html(bt);
			m.find(".modal-dialog").removeClass("modal-lg"); //small window pls
			
		}else if (s.element == null) {
		
			//no element, make a modal window (usually its the first step)
			var m = App.j('#myModal');
			untyped m.modal('show');
			m.addClass("help");
			m.find(".modal-body").html(s.text); 
			m.find(".modal-header").html("<span class='glyphicon glyphicon-hand-right'></span> "+tuto.name);
			
			var bt = App.j("<a class='btn btn-default'><span class='glyphicon glyphicon-chevron-right'></span> OK</a>");
			bt.click(function(?_) {
				untyped m.modal('hide');
				new Tuto(name, step + 1);
			});
			m.find(".modal-footer").html(bt);
			m.find(".modal-dialog").removeClass("modal-lg"); //small window pls
			
		}else {
			
			//prepare Bootstrap "popover"
			var x = App.j(s.element).attr("title", tuto.name+" <div class='pull-right'>"+(step+1)+"/"+tuto.steps.length+"</div>");
			var text = "<p>" + s.text + "</p>";
			var bt = null;
			switch(s.action) {
				case TANext :
					
					bt = App.j("<p><a class='btn btn-default btn-sm'><span class='glyphicon glyphicon-chevron-right'></span> Suite</a></p>");
					bt.click(function(?_) {
						//untyped m.modal('hide');
						new Tuto(name, step + 1);
						if(LAST_ELEMENT!=null) App.j(s.element).removeClass("highlight");
					});
					
				default:
			}
			
			//configure and open popover			
			var p = switch(s.placement) {
				case TPTop: "top";
				case TPBottom : "bottom";
				case TPLeft : "left";
				case TPRight : "right";
				default : null;
			}
			var options = { container:"body", content:text, html:true , placement:p};
			untyped x.popover(options).popover('show');	
			
			
			//add a footer
			var footer = App.j("<div class='footer'><div class='pull-left'></div><div class='pull-right'></div></div>");
			
			if (bt != null) footer.find(".pull-right").append(bt);
			footer.find(".pull-left").append(makeCloseButton('Stop'));
			
			App.j(".popover .popover-content").append(footer);
			
			//highlight
			App.j(s.element).addClass("highlight");
			LAST_ELEMENT = s.element;
		}
	}
	
	/**
	 * Make a "close" bt
	 */
	function makeCloseButton(?text) {
		var bt = App.j("<a class='btn btn-default btn-sm'><span class='glyphicon glyphicon-remove'></span> "+text+"</a>");
		bt.click(function(?_) {
			
			js.Browser.location.href = "/contract?stopTuto=1";
		});
		return bt;
	}
	
}