require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const logger = require("morgan");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client();

//models
const User = require("./models/user");
const Food = require("./models/food");
const Order = require("./models/order");

//middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//session
app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

//ejs
app.set("view-engine", "ejs");

//dbconnect
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB connected"))
  .catch((error) => console.log(error));

//image storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({ storage: storage });

//signup get
app.get("/", (req, res) => {
  res.render("signup.ejs");
});

//signup post
app.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();
    res.redirect("/login");
  } catch {
    res.redirect("/");
  }
});

//login get
app.get("/login", (req, res) => {
    console.log("hii")
  let message = null;
  res.render("login.ejs", { message: message });
});

//login post
app.post("/login/auth/google", async (req, res) => {
  console.log("hello")
  const token = req.body.credential;
  let result
  let verified = true

  if (token) {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.OAUTH_DEV_ID,
    });
    result = ticket.getPayload().email;
  }
  else {
    result = req.body.email
  }

  

  await User.find({ email: result })
    .then((data) => {
      if (data == undefined) {
        const message = "invalid username or password";
        res.render("login.ejs", { message: message });
      }
      const email = data[0].email
      if(token === undefined ) { verified = true }

      if(req.body.password) verified = bcrypt.compareSync(req.body.password, data[0].password);
      if (verified) {
        if (email == "admin@gmail.com") {
          req.session.user = data[0];
          return res.redirect("/adminmenu");
        } else {
          console.log("home")
          req.session.user = data[0];
          return res.redirect("/home");
        }
      } else {
        const message = "invalid username or password";
        return res.render("login.ejs", { message: message });
      }
    })
    .catch((e) => {
      console.log(e);
      res.send("Error");
    });
});

//home page
app.get("/home", (req, res) => {
  res.render("homepage.ejs");
});

//menu page
app.get("/menu", async (req, res) => {
  await Food.find().then((food) => {
    res.render("menu.ejs", {
      foods: food,
    });
  });
});

//add to cart
app.post("/additem/:id", upload.single("image"), async (req, res) => {
  await Food.findById(req.params.id).then((food) => {
    try {
      const item = new Order({
        userid: req.session.user._id,
        name: food.name,
        price: food.price,
        image: food.image,
        qty: req.body.root,
      });
      item.save();
      res.redirect("/menu");
    } catch (error) {
      console.log(error);
      res.send("error");
    }
  });
});

//cart page
app.get("/cart", async (req, res) => {
  await Order.find({ userid: req.session.user._id })
    .then((order) => {
      let totalvalue = 0;
      for (i in order) {
        let value = order[i].qty * order[i].price;
        totalvalue += value;
      }
      console.log(totalvalue);
      res.render("cart.ejs", {
        orders: order,
        name: req.session.user.name,
        total: totalvalue,
      });
    })
    .catch((error) => {
      console.log(error);
      res.send("error");
    });
});

//delete
app.post("/delete/:id", async (req, res) => {
  await Order.findByIdAndDelete({ _id: req.params.id })
    .then((result) => {
      if (result) {
        res.redirect("/cart");
      } else {
        res.send("error");
      }
    })
    .catch((e) => {
      res.send("error in catch");
    });
});

//contact page
app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

//admin menu
app.get("/adminmenu", async (req, res) => {
  await Food.find().then((food) => {
    res.render("admin-menu.ejs", {
      foods: food,
    });
  });
});

//admin page
app.get("/admin", (req, res) => {
  res.render("admin.ejs");
});

//admin post
app.post("/add", upload.single("image"), async (req, res, next) => {
  try {
    const food = new Food({
      name: req.body.name,
      price: req.body.price,
      foodtype: req.body.type,
      image: req.file.filename,
    });
    console.log(food);
    food.save();
    res.redirect("/adminmenu");
  } catch (error) {
    console.log(error);
  }
});

//edit food Get
app.get("/edititem/:id", async (req, res) => {
  await Food.findById(req.params.id)
    .then((food) => {
      console.log(food);
      res.render("update.ejs", {
        foods: food,
      });
    })
    .catch((e) => {
      console.log(e);
      res.send("error");
    });
});

//edit food post
app.post("/update/:id", async (req, res) => {
  await Food.findOneAndUpdate(
    { _id: req.params.id },
    {
      $set: {
        name: req.body.name,
        price: req.body.price,
      },
    }
  )
    .then((result) => {
      if (result) {
        console.log(result);
        res.redirect("/adminmenu");
      } else {
        res.send("error");
      }
    })
    .catch((e) => {
      res.send(e);
    });
});

//logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//middleware
function checkauthentication(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/");
  }
}

//listening on port

let port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Listening on port");
});
