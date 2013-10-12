/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

var XML = require('digger-xml');
var Supplier = require('digger-supplier');
var fs = require('fs');
var async = require('async');

module.exports = function(options, $digger){

	options = options || {};

	var base_folder = options.folder;

	var supplier = Supplier();

	supplier.on('select', function(req, reply){
		
		var use_folder = base_folder + req.url;
		var final_results = [];

		fs.readdir(use_folder, function(error, list){

			var fns = list.map(function(file){

				return function(nextfile){
					fs.readFile(use_folder + '/' + file, 'utf8', function(error, content){
						// blueprints
						if(file.match(/\.xml$/i)){
							final_results = final_results.concat(XML.parse(content));
							nextfile();
						}
						// template
						else if(file.match(/\.html$/i)){
							final_results.push({
								_digger:{
									tag:'template'
								},
								html:content,
								name:file.replace(/\.html$/i, '')
							})
							nextfile();
						}		
					})
					
				}
				
			})

			async.parallel(fns, function(error){
				reply(error, final_results);
			})
			
		})
	})

	return supplier;
}