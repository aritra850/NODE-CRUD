const mongoose = require("mongoose");

const db = new mongoose.Schema({
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

const Account = new mongoose.model("Account", db);

module.export = Account;
