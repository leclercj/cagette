package db;
import sys.db.Object;
import sys.db.Types;

enum DayOfWeek {
	Monday;
	Tuesday;
	Wednesday;
	Thursday;
	Friday;
	Saturday;
	Sunday;
}

enum CycleType {
	Weekly;	
	Monthly;
	BiWeekly;
	TriWeekly;
}


/**
 * Distrib récurrente
 */
class DistributionCycle extends Object
{
	public var id : SId;	
	
	@:relation(contractId) public var contract : Contract;
	
	public var cycleType:SEnum<CycleType>;
	
	public var startDate : SDate; //debut
	public var endDate : SDate;	//fin de la recurrence

	public var startHour : SDateTime; 
	public var endHour : SDateTime;	
	
	public var daysBeforeOrderStart:SNull<STinyInt>;
	public var daysBeforeOrderEnd:SNull<STinyInt>;
	public var openingHour:SNull<SDate>;
	public var closingHour:SNull<SDate>;
	
	@formPopulate("placePopulate") @:relation(placeId) public var place : Place;
	
	
	
	public function new() {
		super();
	}
	
	/**
	 * on créé toutes les distribs en partant du jour de la semaine de la premiere date
	 * 
	 * @TODO refactor this with http://thx-lib.org/api/thx/Dates.html#jump
	 */
	public static function updateChilds(dc:DistributionCycle) {
		
		var datePointer = dc.startDate;
		
		//var dayOfWeek = dc.startDate.getDay();
		if (dc.id == null) throw "this distributionCycle has not been recorded";
		
		//first distrib
		var d = new Distribution();
		d.contract = dc.contract;
		d.distributionCycle = dc;
		d.place = dc.place;
		d.date = new Date(datePointer.getFullYear(), datePointer.getMonth(), datePointer.getDate(), dc.startHour.getHours(), dc.startHour.getMinutes(), 0);
		d.end  = new Date(datePointer.getFullYear(), datePointer.getMonth(), datePointer.getDate(), dc.endHour.getHours()  , dc.endHour.getMinutes()  , 0);
		if (dc.contract.type == Contract.TYPE_VARORDER){
			
			if (dc.daysBeforeOrderEnd == null || dc.daysBeforeOrderStart == null) throw "daysBeforeOrderEnd or daysBeforeOrderStart is null";
			d.orderStartDate = DateTools.delta(d.date, -1.0 * dc.daysBeforeOrderStart * 1000 * 60 * 60 * 24);
			d.orderEndDate = DateTools.delta(d.date, -1.0 * dc.daysBeforeOrderEnd * 1000 * 60 * 60 * 24);
		}
		
		d.insert();
		
		//iterations
		for(i in 0...100) {
			
			var d = new Distribution();
			d.contract = dc.contract;
			d.distributionCycle = dc;
			d.place = dc.place;
			
			//date de la distrib
			var oneDay = 1000 * 60 * 60 * 24.0;
			switch(dc.cycleType) {
				case Weekly :
					datePointer = DateTools.delta(datePointer, oneDay * 7.0);
					//App.log("datePointer : " + datePointer);
					
				case BiWeekly : 	
					datePointer = DateTools.delta(datePointer, oneDay * 14.0);
					
				case TriWeekly : 	
					datePointer = DateTools.delta(datePointer, oneDay * 21.0);
					
				case Monthly :
					datePointer = DateTools.delta(datePointer, oneDay * 28.0);
			}
			
			if (datePointer.getTime() > dc.endDate.getTime()) {
				//App.log("finish");
				break;
			}
			
			//App.log(">>> date def : "+datePointer.toString());
			
			//applique heure de debut et fin
			d.date = new Date(datePointer.getFullYear(), datePointer.getMonth(), datePointer.getDate(), dc.startHour.getHours(), dc.startHour.getMinutes(), 0);
			d.end  = new Date(datePointer.getFullYear(), datePointer.getMonth(), datePointer.getDate(), dc.endHour.getHours(),   dc.endHour.getMinutes(),   0);
			
			if (dc.contract.type == Contract.TYPE_VARORDER){
				
				var a = DateTools.delta(d.date, -1.0 * dc.daysBeforeOrderStart * 1000 * 60 * 60 * 24);
				var h : Date = dc.openingHour;
				d.orderStartDate = new Date(a.getFullYear(), a.getMonth(), a.getDate(), h.getHours(), h.getMinutes(), 0);
				
				var a = DateTools.delta(d.date, -1.0 * dc.daysBeforeOrderEnd * 1000 * 60 * 60 * 24);
				var h : Date = dc.closingHour;
				d.orderEndDate = new Date(a.getFullYear(), a.getMonth(), a.getDate(), h.getHours(), h.getMinutes(), 0);
			}
			
			d.insert();
		}
	}
	
	public function placePopulate():Array<{label:String,value:Int}> {
		var out = [];
		var places = db.Place.manager.search($amapId == App.current.user.amap.id, false);
		for (p in places) out.push( { label:p.name,value :p.id } );
		return out;
	}
}