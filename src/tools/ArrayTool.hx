package tools;

/**
 * Some utility functions for arrays
 */
class ArrayTool
{
	/**
	 * shuffle (randomize) an array
	 */
	public static function shuffle<T>(arr:Array<T>):Array<T>
	{
		if (arr!=null) {
			for (i in 0...arr.length) {
				var j = Std.random(arr.length);
				var a = arr[i];
				var b = arr[j];
				arr[i] = b;
				arr[j] = a;
			}
		}
		return arr;
	}
	
	/**
	 * Group a list of objects by date
	 * @param	objs			List of objects
	 * @param	dateParamName	Name of the object field which is a date
	 * @return
	 */
	public static function groupByDate(objs:Array<Dynamic>,dateParamName:String):Map<String,Dynamic>{
	
		var out = new Map<String,Dynamic>();
		for ( o in objs){
			var d : Date = Reflect.field(o, dateParamName);
			var group = out.get(d.toString());
			if (group == null) group = [];
			group.push(o);
			out.set(d.toString(), group);
			
		}
		return out;
		
		
		
	}
	
	
	public static function mapLength<T>(m:Map<T,Dynamic>):Int{
		var i = 0;
		for (x in m) i++;
		return i;
	}
	
}