package db;
import sugoi.form.ListData;
import sys.db.Object;
import sys.db.Types;
import Common;
/**
 * Distrib
 */
class Distribution extends Object
{
	public var id : SId;	
	
	@:relation(contractId)
	public var contract : Contract;
	
	@formPopulate("placePopulate")
	@:relation(placeId)
	public var place : Place;
	
	public var text : SNull<SString<1024>>;
	
	//start and end date for open orders
	@hideInForms public var orderStartDate : SNull<SDateTime>; 
	@hideInForms public var orderEndDate : SNull<SDateTime>;
	
	//start and end date for delivery
	public var date : SDateTime; 
	public var end : SDateTime;
	//public var deliveryStartDate : SDateTime; 
	//public var deliveryEndDate : SDateTime;
	
	@:relation(distributionCycleId) public var distributionCycle : SNull<DistributionCycle>;
	#if neko 
	public var distributionCycleId: SNull<SInt>; 
	#end
	
	@formPopulate("populate") @:relation(distributor1Id) public var distributor1 : SNull<db.User>; 
	@formPopulate("populate") @:relation(distributor2Id) public var distributor2 : SNull<db.User>; 
	@formPopulate("populate") @:relation(distributor3Id) public var distributor3 : SNull<db.User>; 
	@formPopulate("populate") @:relation(distributor4Id) public var distributor4 : SNull<db.User>; 
	
	#if neko
	public var distributor1Id : SNull<SInt>;
	public var distributor2Id : SNull<SInt>;
	public var distributor3Id : SNull<SInt>;
	public var distributor4Id : SNull<SInt>;
	#end
	
	public function new() 
	{
		super();
		date = Date.now();
		end = DateTools.delta(date, 1000 * 60 * 90);
	}
	
	/**
	 * get group members list as form data
	 */
	public function populate():FormData<Int> {
		return App.current.user.getAmap().getMembersFormElementData();
	}
	
	/**
	 * get groups places as form data
	 * @return
	 */
	public function placePopulate():FormData<Int> {
		var out = [];
		var places = db.Place.manager.search($amapId == App.current.user.amap.id, false);
		for (p in places) out.push( { label:p.name,value:p.id} );
		return out;
	}
	
	public function hasEnoughDistributors() {
		var n = contract.distributorNum;
		
		var d = 0;
		if (distributor1 != null) d++;
		if (distributor2 != null) d++;
		if (distributor3 != null) d++;
		if (distributor4 != null) d++;
		
		return (d >= n) ;
	}
	
	public function isDistributor(u:User) {
		if (u == null) return false;
		return (u.id == distributor1Id) || (u.id == distributor2Id) || (u.id == distributor3Id) || (u.id == distributor4Id);
	}
	
	override public function toString() {
			return "Distribution du " + date.toString()+" de "+contract.name;
	}
	
	public function getOrders() {
	
		var pids = db.Product.manager.search($contract == this.contract, false);
		var pids = Lambda.map(pids, function(x) return x.id);
		//var sql = "select u.firstName , u.lastName as uname, u.id as uid, p.name as pname ,u.firstName2 , u.lastName2, u.phone, u.email, up.* from User u, UserContract up, Product p where up.userId=u.id and up.productId=p.id and p.contractId=" + contract.id;
		//if (contract.type == db.Contract.TYPE_VARORDER) {
			//sql += " and up.distributionId=" + this.id;	
		//}
		//
		//sql += " order by uname asc";
		//return sys.db.Manager.cnx.request(sql).results();
		
		if ( this.contract.type == Contract.TYPE_CONSTORDERS){
			return UserContract.manager.search( ($productId in pids), false); 
		}else{
			return UserContract.manager.search($distribution == this, false); 
		}
		
		
	}
	
	/**
	 * 
	 */
	public function canOrderNow() {
		
		if (orderEndDate == null) {
			return this.contract.isUserOrderAvailable();
		}else {
			var n = Date.now().getTime();
			var f = this.contract.flags.has(UsersCanOrder);
			
			return f && n < orderEndDate.getTime() && n > orderStartDate.getTime();
			
		}
	}

	/**
	 * Get next multi-devliveries
	 * ( deliveries including more than one vendors )
	 */
	/*public static function getNextMultiDeliveries(){

		var out = new Map<String,{place:Place,startDate:Date,endDate:Date,active:Bool,products:Array<ProductInfo>}>();
		return Lambda.array(manager.search($orderStartDate <= Date.now() && $orderEndDate >= Date.now() && $contract==contract,false));

		var now = Date.now();

		var contracts = Contract.getActiveContracts(App.current.user.amap);
		var cids = Lambda.map(contracts, function(p) return p.id);

		//available deliveries + some of the next deliveries

		var distribs = db.Distribution.manager.search(($contractId in cids) && $orderEndDate >= now, { orderBy:date }, false);
		var inOneMonth = DateTools.delta(now, 1000.0 * 60 * 60 * 24 * 30);
		for (d in distribs) {

			var o = out.get(d.getKey());
			if (o == null) o = {place:d.place, startDate:d.date,active:null, endDate:d.end, products:[]};
			for ( p in d.contract.getProductsPreview(8)){
				if (o.products.length >= 8) break;
				o.products.push(	p.infos() );
			}

			if (d.orderStartDate.getTime() <= now.getTime() ){
				//order currently open
				o.active = true;
			}else if (d.orderStartDate.getTime() <= inOneMonth.getTime() ){
				//open soon
				o.active = false;
			}else{
				continue;

			}

			out.set(d.getKey(), o);

		}
		return Lambda.array(out);
	}*/


	/**
     * Get open to orders deliveries
     * @param	contract
     */
    public static function getOpenToOrdersDeliveries(contract:db.Contract){

        return Lambda.array(manager.search($orderStartDate <= Date.now() && $orderEndDate >= Date.now() && $contract==contract,false));


    }



	/**
	 * Return a string like $placeId-$date
	 */
	public function getKey():String{
		return date.toString().substr(0, 10) +"-"+Std.string(place.id);
	}



}