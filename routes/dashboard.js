const express = require('express');
const router = express.Router();
const stringtags = require('striptags');
const momont = require('moment');
const convertPagination = require('../modules/convertPagination');
const firebaseAdminDb = require('../connections/firebase_admin');

const user = firebaseAdminDb.ref('users');
const categoriesRef = firebaseAdminDb.ref('categories');
const articlesRef = firebaseAdminDb.ref('articles');

//get
router.get('/article/create', function (req, res) {
    categoriesRef.once('value', function(snapshot){
        const categories = snapshot.val();
        res.render('dashboard/article', {
            categories
        });
    });
});

router.get('/article/:id', function (req, res) {
    const id = req.param('id');
    let categories = {};
    categoriesRef.once('value').then(function(snapshot){
        categories = snapshot.val();
        return articlesRef.child(id).once('value');
    }).then(function(snapshot){
        const article = snapshot.val();
        res.render('dashboard/article', {
            categories,
            article
        });
    });
});

router.get('/archives', function (req, res, next) {
    const status = req.query.status || 'public';
    let currentPage = Number.parseInt(req.query.page) || 1;//目前頁數
    let categories = {};
    categoriesRef.once('value').then(function(snapshot){
        categories = snapshot.val();
        return articlesRef.orderByChild('update_time').once('value');
    }).then(function(snapshot){
        const articles = [];
        snapshot.forEach(function(snapshotChild){
            if(status === snapshotChild.val().status){
                articles.push(snapshotChild.val());
            }
        });
        articles.reverse();
        //分頁
        const pageData = convertPagination(articles,currentPage);
        //分頁 end
        res.render('dashboard/archives', {
            articles: pageData.pageData,
            categories,
            stringtags,
            momont,
            status,
            page: pageData.page
        });
    });
});

router.get('/categories', function (req, res, next) {
    const msg = req.flash('info');
    categoriesRef.once('value', function(snapshot){
        const category = snapshot.val();
        res.render('dashboard/categories', {
            msg,
            hasInfo: msg.length > 0,
            category
        });
    });
});


//post

router.post('/article/create', function (req, res) {
    let uid = req.session.uid;
    user.child(uid).once('value').then(function(snapshot){
        let nickname = snapshot.val().nickname;
        const data = req.body;
        const articleRef = articlesRef.push();
        const key = articleRef.key;
        const updateTime = Math.floor(Date.now() / 1000);
        data.id = key;
        data.user = nickname;
        data.update_time = updateTime;
        let dataJSON = JSON.parse(JSON.stringify(data));
        articleRef.set(dataJSON).then(function(){
            res.redirect(`/dashboard/article/${key}`);
        });
    });
});

router.post('/article/update/:id', function (req, res) {
    const data = req.body;
    const id = req.param('id');
    const updateTime = Math.floor(Date.now() / 1000);
    data.update_time = updateTime;
    let dataJSON = JSON.parse(JSON.stringify(data));
    articlesRef.child(id).update(dataJSON).then(function(){
        res.redirect(`/dashboard/article/${id}`);
    });
});

router.post('/article/delete/:id', function (req, res) {
    const id = req.param('id');
    articlesRef.child(id).remove();
    res.send('文章已刪除')
    res.end();
});

router.post('/categories/create', function (req, res) {
    let data = req.body;
    const categoryRef = categoriesRef.push();
    const key = categoryRef.key;
    data.id = key;
    console.log(data.name);
    categoriesRef.orderByChild('path').equalTo(data.path).once('value').then(function(snapshot){
        if(snapshot.val() !== null){
            req.flash('info','已有相同路徑');
            res.redirect('/dashboard/categories');
        }else if(data.name === '' || data.path === ''){
            req.flash('info','欄位不能為空，請輸入分類名稱與路徑');
            res.redirect('/dashboard/categories');
        }else {
            let dataJSON = JSON.parse(JSON.stringify(data));
            categoryRef.set(dataJSON).then(function(){
                res.redirect('/dashboard/categories');
            });
        }
    });
});

router.post('/categories/delete/:id', function (req, res, next) {
    const id = req.param('id');
    let cotegories_num = 0;
    articlesRef.orderByChild('category').equalTo(id).once('value').then(function(snapshot){
        snapshot.forEach(function(snapshotChild){
            if(id === snapshotChild.val().category){
                cotegories_num ++;
            };
        });
        if(cotegories_num > 0){
            req.flash('info','此分類有' + cotegories_num + '則文章無法刪除');
            res.redirect('/dashboard/categories');
        }else{
            categoriesRef.child(id).remove();
            req.flash('info','欄位已被刪除');
            res.redirect('/dashboard/categories');
        }
    });
});



module.exports = router;