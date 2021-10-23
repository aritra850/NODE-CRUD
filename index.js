const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const hbs = require("hbs");
const port = 3500;

//CONNECTING DATABASE
const conn =
  "mongodb+srv://aritra850:Aritra1998@cluster0.3rnuz.mongodb.net/user?retryWrites=true&w=majority";
mongoose
  .connect(conn, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("BACKEND SUCCESSFULLY CONNECTED");
  })
  .catch((err) => console.log(err));

//CONFIGURING SCHEMA
const dbs = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
});

const ms = new mongoose.Schema({
  userid:{
    type:String
  }
})

const dbnote = new mongoose.Schema({
  email: {
    type: String,
  },
  title: {
    type: String,
  },
  note: {
    type: String,
  },
});

const Account = new mongoose.model("Account", dbs);
const mySession = new mongoose.model("mySession",ms);
const Note = new mongoose.model("Note",dbnote);

//CONFIGURATIN & MIDDLEWARE
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "/templates/views"));
hbs.registerPartials(path.join(__dirname, "/templates/partials"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//GET REQUESTS
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

//R -> READ
app.get("/content/:clint",async(req,res)=>{

  if(!req.params.clint){
    return res.redirect("/login");
  }
  const result = await Note.find({email:req.params.clint});
  const clint =await Account.findOne({ email:req.params.clint })
  const verify = await mySession.findOne({userid:req.params.clint});
  if(!verify){
    return res.redirect("/login");
  }
  res.render("content",{userid:clint.name,id:verify._id,email:verify.userid,notes:result});
})

app.get("/logout/:id",(req,res)=>{
  mySession.findByIdAndRemove({_id:req.params.id}).
  then((exc) => {
    // console.log("DELETE"+exc);
    res.redirect("/login");
  })
})

//D -> DELETE
app.get("/content/delete/:id/:email",async(req,res)=>{
  try{
    Note.findByIdAndRemove({_id:req.params.id}).
    then((exc)=>{
      res.redirect("/content/"+req.params.email);
    })
  }catch(err){
    console.log(err);
  }
})

app.get("/content/edit/:noteid/:email/:id",async (req,res)=>{
  try{
    const clint =await Account.findOne({ email:req.params.email })
    const data = await Note.findOne({_id:req.params.noteid});
    res.render("update",{
      id:req.params.id,
      userid:clint.name,
      note_id:req.params.noteid,
      email:req.params.email,
      title:data.title,
      fullnote:data.note
    })
  }catch(err){
    console.log(err);
  }
})

//POST REQUESTS
app.post("/", async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password, cpassword } = req.body;
    let msg = "";

    await Account.findOne({ email: email })
      .then(async (exist) => {
        if (exist) {
          return res.status(201).json("EMAIL : "+email+" ALREADY EXIST ... ");
        }

        const user = new Account({ name, email, password });
        await user.save().then(res.status(201).redirect("/login"));
      })
      .catch((err) => {
        return res.status(422).json("ERROR OCCOURED");
      });
  } catch (err) {
    res.status(400).send(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;

    await Account.findOne({ email: email, password:password })
      .then(async(exist) => {
        if (exist) {
          const clint = new mySession({userid:exist.email});
          await clint.save();
          // .then(res.redirect("/content/"+exist.email));
          return res.status(201).redirect("/content/"+exist.email);
        }
        return res.status(422).json("USER DOES NO EXIST");
        
      })
      .catch((err) => {
        return res.status(422).json("ERROR OCCOURED");
      });
  } catch (err) {
    res.status(400).send(err);
  }
});

//C -> CREATE
app.post("/content/:id", async (req, res) => {
  try {
    // console.log(req.body);
    const { title,note } = req.body;

    const clint =await Account.findOne({ email:req.params.id })
    const email = clint.email;
    const notes = new Note({email,title,note})
    await Note.findOne({ email: email,title:title })
      .then(async(exist) => {
        if (!exist) {
          // console.log(exist);
          await notes.save();
          return res.status(201).redirect("/content/"+clint.email);
        }
        return res.status(422).json("TITLE ALREADY EXIST");
        
      })
      .catch((err) => {
        return res.status(422).json("ERROR OCCOURED");
      });
  } catch (err) {
    res.status(400).send(err);
  }
});

//U -> UPDATE
app.post("/content/edit/:noteid/:email", async (req,res) =>{
  try{
    const {title,note} = req.body;
    const edit = await Note.updateOne({_id:req.params.noteid},{title,note});
    if(edit){
      res.redirect("/content/"+req.params.email);
    }
    else{
      console.log("UPADATE FAILED !!!");
    }
  }catch(err){
    console.log(err);
  }
})

//STARTING SERVER
app.listen(port, () => {
  console.log("connected :" + port);
});
