//Test for Server

var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var fs = require("fs");
var istanbul = require('istanbul');

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["analysis.js"];
	}
	var filePath = args[0];
	
	complexity(filePath);
	complexityBuilder.report();

	//dynamic(filePath);

}

function dynamic(filePath)
{
	var inst = new istanbul.Instrumenter({embedSource:true});
	var buf = fs.readFileSync(filePath, 'utf8');
	inst.instrument(buf, function (err, data) {
		console.log(data);
	});
}

var complexityBuilder = 
{
	Functions:0,
	// Number of if statements/loops + 1
	SimpleCyclomaticComplexity: 0,
	// The max depth of scopes (nested ifs, loops, etc)
	MaxNestingDepth: 0,
	// Average number of p22ameters for functions
	MeanParameterCount: 0,
	// Max number of parameters for functions
	MaxParameterCount: 0,

	report : function()
	{
		console.log(
		   ("Number of functions {0}\n" + 
			"Cyclomatic complexity {1}\n" +
			"Nesting Depth {2}\n" +
			"Mean Parameters {3}\n" +
			"Max Parameters {4}\n")
			.format(complexityBuilder.Functions,complexityBuilder.SimpleCyclomaticComplexity, this.MaxNestingDepth,
			        complexityBuilder.MeanParameterCount, complexityBuilder.MaxParameterCount)
		);
	}
};

function complexity(filePath)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);

	var paramtotal = 0;

	traverse(result, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{

			complexityBuilder.Functions++;

			var result = {nestedDepth:0};
			visitDepth(node, 0, result);

			
			if(result.nestedDepth > complexityBuilder.MaxNestingDepth){
				complexityBuilder.MaxNestingDepth = result.nestedDepth;
			}

			paramtotal += node.params.length;

			if(node.params.length > complexityBuilder.MaxParameterCount){
				complexityBuilder.MaxParameterCount = node.params.length;
			}


			
			console.log( "Line : {0} Function: {1}. Parameters: {2}. Depth: {3}".format(node.loc.start.line,
				functionName(node), node.params.length, result.nestedDepth));
		}

		if(node.type == 'IfStatement' || node.type == 'WhileStatement' || node.type == 'ForStatement')
		{

			complexityBuilder.SimpleCyclomaticComplexity++;
		}



	});

	complexityBuilder.MeanParameterCount = paramtotal / complexityBuilder.Functions;

}

function visitDepth(node, depth, result)
{
    var key, child;
    var children = 0;

	for (key in node) {
	    if (node.hasOwnProperty(key)) {
	        child = node[key];
	        if (typeof child === 'object' && child !== null) {
	           	//console.log(depth);
	           	if(key == "alternate"){
	           		visitDepth(child, depth, result);
	           	}
	           	else if(isDecision(child)){
	            	visitDepth(child, depth+1, result);
	            }
	            else{
	            	visitDepth(child, depth, result);
	            }
	            children++;
	        }
	    }
	}

	if(children == 0){

		if(result.nestedDepth < depth){
			//console.log(depth)
 			result.nestedDepth = depth;
 		}
 	}
}

function isDecision(node){

	if(node.type == 'IfStatement' ||
		node.type == 'ForStatement' ||
		node.type == 'WhileStatement' ||
		node.type == 'ForInStatement' ||
		node.type == 'DoWhileStatement'){
		return true;
	}
	else{
	 	return false;
	 }
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();


