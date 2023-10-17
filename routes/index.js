var express = require('express');
var router = express.Router();
var db= require('../db')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '홈페이지',pageName:'home.ejs'});
});


//지역 검색 페이지
router.get('/search', function(req, res){
  res.render('index', {title:'지역검색', pageName:'local/search.ejs'})
});

//도서목록 JSON
router.get('/books.json', function(req, res){
  const page=parseInt(req.query.page);
  //console.log('........', page);
  const start=(page-1)*6;
  const sql=`select * from books order by bid desc limit ?,6`;
  db.get().query(sql,[start], function(err, rows){
    if(err) console.log('도서목록 JSON 오류:', err);
    res.send(rows);
  })
});

//홈페이지 도서 갯수 출력
router.get('/count', function(req, res){
    const sql='select count(*) total from books';
    db.get().query(sql, function(err, rows){
        res.send(rows[0].total.toString());
    });
});
module.exports = router;
