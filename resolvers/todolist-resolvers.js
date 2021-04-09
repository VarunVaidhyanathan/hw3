const ObjectId = require('mongoose').Types.ObjectId;
const Todolist = require('../models/todolist-model');

// The underscore param, "_", is a wildcard that can represent any value;
// here it is a stand-in for the parent parameter, which can be read about in
// the Apollo Server documentation regarding resolvers

module.exports = {
	Query: {
		/** 
		 	@param 	 {object} req - the request object containing a user id
			@returns {array} an array of todolist objects on success, and an empty array on failure
		**/
		getAllTodos: async (_, __, { req }) => {
			const _id = new ObjectId(req.userId);
			if(!_id) { return([])};
			const todolists = await Todolist.find({owner: _id});
			if(todolists) return (todolists);

		},
		/** 
		 	@param 	 {object} args - a todolist id
			@returns {object} a todolist on success and an empty object on failure
		**/
		getTodoById: async (_, args) => {
			const { _id } = args;
			const objectId = new ObjectId(_id);
			const todolist = await Todolist.findOne({_id: objectId});
			if(todolist) return todolist;
			else return ({});
		},
	},
	Mutation: {
		/** 
		 	@param 	 {object} args - a todolist id and an empty item object
			@returns {string} the objectID of the item or an error message
		**/
		addItem: async(_, args) => {
			const { _id, item , index } = args;
			const listId = new ObjectId(_id);
			const objectId = new ObjectId();
			const found = await Todolist.findOne({_id: listId});
			if(!found) return ('Todolist not found');
			if(item._id === '') item._id = objectId;
			let listItems = found.items;
			if(index < 0) listItems.push(item);
   			else listItems.splice(index, 0, item);
			
			const updated = await Todolist.updateOne({_id: listId}, { items: listItems });

			if(updated) return (item._id);
			else return ('Could not add item');
		},
		/** 
		 	@param 	 {object} args - an empty todolist object
			@returns {string} the objectID of the todolist or an error message
		**/
		addTodolist: async (_, args) => {
			const { todolist } = args;
			const objectId = new ObjectId();
			const { id, name, owner, items } = todolist;
			const newList = new Todolist({
				_id: objectId,
				id: id,
				name: name,
				owner: owner,
				items: items
			});
			const updated = await newList.save();
			//await newList.save();
			if(updated) return objectId;
			else return ('Could not add todolist');
		},
		/** 
		 	@param 	 {object} args - a todolist objectID and item objectID
			@returns {array} the updated item array on success or the initial 
							 array on failure
		**/
		deleteItem: async (_, args) => {
			const  { _id, itemId } = args;
			const listId = new ObjectId(_id);
			const found = await Todolist.findOne({_id: listId});
			let listItems = found.items;
			listItems = listItems.filter(item => item._id.toString() !== itemId);
			const updated = await Todolist.updateOne({_id: listId}, { items: listItems })
			if(updated) return (listItems);
			else return (found.items);

		},
		/** 
		 	@param 	 {object} args - a todolist objectID 
			@returns {boolean} true on successful delete, false on failure
		**/
		deleteTodolist: async (_, args) => {
			const { _id } = args;
			const objectId = new ObjectId(_id);
			const deleted = await Todolist.deleteOne({_id: objectId});
			if(deleted) return true;
			else return false;
		},
		/** 
		 	@param 	 {object} args - a todolist objectID, field, and the update value
			@returns {boolean} true on successful update, false on failure
		**/
		updateTodolistField: async (_, args) => {
			const { field, value, _id } = args;
			const objectId = new ObjectId(_id);
			const updated = await Todolist.updateOne({_id: objectId}, {[field]: value});
			if(updated) return value;
			else return "";
		},
		/** 
			@param	 {object} args - a todolist objectID, an item objectID, field, and
									 update value. Flag is used to interpret the completed 
									 field,as it uses a boolean instead of a string
			@returns {array} the updated item array on success, or the initial item array on failure
		**/
		updateItemField: async (_, args) => {
			const { _id, itemId, field,  flag } = args;
			let { value } = args
			const listId = new ObjectId(_id);
			const found = await Todolist.findOne({_id: listId});
			let listItems = found.items;
			if(flag === 1) {
				if(value === 'complete') { value = true; }
				if(value === 'incomplete') { value = false; }
			}
			listItems.map(item => {
				if(item._id.toString() === itemId) {	
					
					item[field] = value;
				}
			});
			const updated = await Todolist.updateOne({_id: listId}, { items: listItems })
			if(updated) return (listItems);
			else return (found.items);
		},
		/**
			@param 	 {object} args - contains list id, item to swap, and swap direction
			@returns {array} the reordered item array on success, or initial ordering on failure
		**/
		reorderItems: async (_, args) => {
			const { _id, itemId, direction } = args;
			const listId = new ObjectId(_id);
			const found = await Todolist.findOne({_id: listId});
			let listItems = found.items;
			const index = listItems.findIndex(item => item._id.toString() === itemId);
			// move selected item visually down the list
			if(direction === 1 && index < listItems.length - 1) {
				let next = listItems[index + 1];
				let current = listItems[index]
				listItems[index + 1] = current;
				listItems[index] = next;
			}
			// move selected item visually up the list
			else if(direction === -1 && index > 0) {
				let prev = listItems[index - 1];
				let current = listItems[index]
				listItems[index - 1] = current;
				listItems[index] = prev;
			}
			const updated = await Todolist.updateOne({_id: listId}, { items: listItems })
			if(updated) return (listItems);
			// return old ordering if reorder was unsuccessful
			listItems = found.items;
			return (found.items);

		},

		sortTodoItemsUndo: async (_, args) => {
			const { _id, oldList } = args;
			let copyListItems = [];
			const listId = new ObjectId(_id);
			const found = await Todolist.findOne({_id: listId});
			let listItems = found.items;
			for(let i=0;i<oldList.length;i++){
				for(let j=0; j< listItems.length; j++){
					if(listItems[j].id === oldList[i].id){
						console.log("Hello world");
						copyListItems.push(listItems[j]);
					}
				}
			}
			console.log(copyListItems);
			const updated = await Todolist.updateOne({_id: listId}, { items: copyListItems })
			return (copyListItems);
		},
		//resolver to sort item task wise
		sortTaskItems: async (_, args) => {
			const { _id} = args;
			let num = 1;
			// if(flag == false)
			// 	num = 1;
			// console.log(num);
			const listId = new ObjectId(_id);
			const found = await Todolist.findOne({_id: listId});
			let listItems = found.items;
			let copyListItems = [];
			for(let i=0;i<listItems.length;i++){
				copyListItems.push(listItems[i]);
			}
			//listItems[0].description = listItems[1].description;
			for(let i=0;i<listItems.length;i++){
				for(let j=0;j<listItems.length-1;j++){
					if(listItems[i].description.localeCompare(listItems[j].description) == num){
						let temp = listItems[j];
						console.log("temp 1st sort : "+temp);
						listItems[j] = listItems[i];
						listItems[i] = temp;
						console.log("listItems[j] 1st sort :"+listItems[j]);
					}
				}
			}
			let k = false;
			for(let i=0;i<listItems.length;i++){
				console.log("listItems[i].description: "+listItems[i]);
				console.log("copyListItems[i].description: "+copyListItems[i]);
				if(listItems[i].description.localeCompare(copyListItems[i].description)!= 0){
					k = true;
					console.log("lists are different");
				}
			}
			if(k==false){
				num = 1;
				console.log("lists are same");
				for(let i=0;i<listItems.length;i++){
					for(let j=0;j<listItems.length-1;j++){
						console.log(listItems[j].description+"    "+listItems[i].description);
						if(listItems[j].description.localeCompare(listItems[i].description) == num){
							console.log("swap performed");
							let temp = listItems[j];
							console.log("temp : "+temp);
							listItems[j] = listItems[i];
							listItems[i] = temp;
							console.log("listItems[j] :"+listItems[j]);
						}
					}
				}
			}
			//if(listItems == found.items){
			//	console.log("UHSUYGSHIUHS");
			// 	for(let i=0;i<listItems.length;i++){
			// 		for(let j=0;j<listItems.length;j++){
			// 			if(listItems[i].description.localeCompare(listItems[j].description) == 1){
			// 				let temp = listItems[j];
			// 				listItems[j] = listItems[i];
			// 				listItems[i] = temp;
			// 			}
			// 		}
			// 	}
			//}
			
			console.log("first item: "+listItems[0].description);
			console.log("resolver @@@@@@@@@@@@@@reached");
			// for(let i = 0; i< listItems.length; i++){
			// 	if(listItems[i] != found.items[i]){
			// 		return (listItems);;
			// 	}
			// }
			const updated = await Todolist.updateOne({_id: listId}, { items: listItems })
			if(updated) return (copyListItems);
			//listItems = copyListItems;
			return (listItems);
			
		},
		//resolver to sort item date wise
		sortDateItems: async (_, args) => {
			const { _id} = args;
			let num = 1;
			// if(flag == false)
			// 	num = 1;
			// console.log(num);
			const listId = new ObjectId(_id);
			const found = await Todolist.findOne({_id: listId});
			let listItems = found.items;
			let copyListItems = [];
			for(let i=0;i<listItems.length;i++){
				copyListItems.push(listItems[i]);
			}
			//listItems[0].description = listItems[1].description;
			for(let i=0;i<listItems.length;i++){
				for(let j=0;j<listItems.length-1;j++){
					if(listItems[i].due_date.localeCompare(listItems[j].due_date) == num){
						let temp = listItems[j];
						console.log("temp 1st sort : "+temp);
						listItems[j] = listItems[i];
						listItems[i] = temp;
						console.log("listItems[j] 1st sort :"+listItems[j]);
					}
				}
			}
			let k = false;
			for(let i=0;i<listItems.length;i++){
				console.log("listItems[i].due_date: "+listItems[i]);
				console.log("copyListItems[i].due_date: "+copyListItems[i]);
				if(listItems[i].due_date.localeCompare(copyListItems[i].due_date)!= 0){
					k = true;
					console.log("lists are different");
				}
			}
			if(k==false){
				num = 1;
				console.log("lists are same");
				for(let i=0;i<listItems.length;i++){
					for(let j=0;j<listItems.length-1;j++){
						console.log(listItems[j].due_date+"    "+listItems[i].due_date);
						if(listItems[j].due_date.localeCompare(listItems[i].due_date) == num){
							console.log("swap performed");
							let temp = listItems[j];
							console.log("temp : "+temp);
							listItems[j] = listItems[i];
							listItems[i] = temp;
							console.log("listItems[j] :"+listItems[j]);
						}
					}
				}
			}
			//if(listItems == found.items){
			//	console.log("UHSUYGSHIUHS");
			// 	for(let i=0;i<listItems.length;i++){
			// 		for(let j=0;j<listItems.length;j++){
			// 			if(listItems[i].description.localeCompare(listItems[j].description) == 1){
			// 				let temp = listItems[j];
			// 				listItems[j] = listItems[i];
			// 				listItems[i] = temp;
			// 			}
			// 		}
			// 	}
			//}
			
			console.log("first item: "+listItems[0].due_date);
			console.log("resolver @@@@@@@@@@@@@@reached");
			// for(let i = 0; i< listItems.length; i++){
			// 	if(listItems[i] != found.items[i]){
			// 		return (listItems);;
			// 	}
			// }
			const updated = await Todolist.updateOne({_id: listId}, { items: listItems })
			if(updated) return (copyListItems);
			//listItems = copyListItems;
			return (listItems);
			
		},//resolver to sort item status wise
		sortStatusItems: async (_, args) => {
			const { _id} = args;
			let num = 1;
			// if(flag == false)
			// 	num = 1;
			// console.log(num);
			const listId = new ObjectId(_id);
			const found = await Todolist.findOne({_id: listId});
			let listItems = found.items;
			let copyListItems = [];
			for(let i=0;i<listItems.length;i++){
				copyListItems.push(listItems[i]);
			}
			let isorted = [];
			for(let i=0;i<listItems.length;i++){
				if(!listItems[i].completed){
					isorted.push(listItems[i]);
				}
			}
			for(let i=0;i<listItems.length;i++){
				if(listItems[i].completed){
					isorted.push(listItems[i]);
				}
			}
			let csorted = [];
			for(let i=0;i<listItems.length;i++){
				if(listItems[i].completed){
					csorted.push(listItems[i]);
				}
			}
			for(let i=0;i<listItems.length;i++){
				if(!listItems[i].completed){
					csorted.push(listItems[i]);
				}
			}
			console.log("isorted : "+isorted);
			console.log("csorted : "+csorted);
			let k = true;
			for(let i=0;i<listItems.length;i++){
				if(listItems[i].completed != isorted[i].completed){
					k = false;
				}
			}
			if(k){
				listItems = csorted;
			}
			else{
				listItems = isorted;
			}
			console.log("listItems: "+listItems);

			const updated = await Todolist.updateOne({_id: listId}, { items: listItems })
			if(updated) return (copyListItems);
			//listItems = copyListItems;
			return (listItems);
	
		},
		//resolver to sort item assigned_to wise
		sortAssignedItems: async (_, args) => {
			const { _id} = args;
			let num = 1;
			// if(flag == false)
			// 	num = 1;
			// console.log(num);
			const listId = new ObjectId(_id);
			const found = await Todolist.findOne({_id: listId});
			let listItems = found.items;
			let copyListItems = [];
			for(let i=0;i<listItems.length;i++){
				copyListItems.push(listItems[i]);
			}
			//listItems[0].description = listItems[1].description;
			for(let i=0;i<listItems.length;i++){
				for(let j=0;j<listItems.length-1;j++){
					if(listItems[i].assigned_to.localeCompare(listItems[j].assigned_to) == num){
						let temp = listItems[j];
						console.log("temp 1st sort : "+temp);
						listItems[j] = listItems[i];
						listItems[i] = temp;
						console.log("listItems[j] 1st sort :"+listItems[j]);
					}
				}
			}
			let k = false;
			for(let i=0;i<listItems.length;i++){
				console.log("listItems[i].description: "+listItems[i]);
				console.log("copyListItems[i].description: "+copyListItems[i]);
				if(listItems[i].assigned_to.localeCompare(copyListItems[i].assigned_to)!= 0){
					k = true;
					console.log("lists are different");
				}
			}
			if(k==false){
				num = 1;
				console.log("lists are same");
				for(let i=0;i<listItems.length;i++){
					for(let j=0;j<listItems.length-1;j++){
						console.log(listItems[j].assigned_to+"    "+listItems[i].assigned_to);
						if(listItems[j].assigned_to.localeCompare(listItems[i].assigned_to) == num){
							console.log("swap performed");
							let temp = listItems[j];
							console.log("temp : "+temp);
							listItems[j] = listItems[i];
							listItems[i] = temp;
							console.log("listItems[j] :"+listItems[j]);
						}
					}
				}
			}
			//if(listItems == found.items){
			//	console.log("UHSUYGSHIUHS");
			// 	for(let i=0;i<listItems.length;i++){
			// 		for(let j=0;j<listItems.length;j++){
			// 			if(listItems[i].description.localeCompare(listItems[j].description) == 1){
			// 				let temp = listItems[j];
			// 				listItems[j] = listItems[i];
			// 				listItems[i] = temp;
			// 			}
			// 		}
			// 	}
			//}
			
			console.log("first item: "+listItems[0].description);
			console.log("resolver @@@@@@@@@@@@@@reached");
			// for(let i = 0; i< listItems.length; i++){
			// 	if(listItems[i] != found.items[i]){
			// 		return (listItems);;
			// 	}
			// }
			const updated = await Todolist.updateOne({_id: listId}, { items: listItems })
			if(updated) return (copyListItems);
			//listItems = copyListItems;
			return (listItems);
			
		}

	
	}
}