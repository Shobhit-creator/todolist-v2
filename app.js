//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://<username>:<password>@cluster0.sg1y8.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist."
});

const item2 = new Item({
  name: "Hit the button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function (err) {
        if(err) {
          console.log("err");
        } else {
          console.log("Successfully saved default items to DB!");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function(req, res){
  
   const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundlist){
     if(!err){
        if(!foundlist){
          // Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
        }else{
         // Show an existing list
         res.render("list", {listTitle: foundlist.name, newListItems: foundlist.items});
        }
      }
   });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
      item.save();
      res.redirect("/");
  }else{
      List.findOne({name: listName}, function(err, foundList){
           foundList.items.push(item);
           foundList.save();
           res.redirect("/" + listName);
      });
  }
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    
    if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted the checked item.");
        res.redirect("/");
      }else{
        console.log(err);
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundlist){
      if(!err){
        res.redirect("/"+ listName);
      }
    });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
});
