var express = require('express');
var router = express.Router();
var db=require('../db');
var multer= require('multer');

//도서 이미지 업로드함수
var upload = multer({
    storage:multer.diskStorage({
        destination:(req, file, done)=>{
            done(null, './public/upload/book')
        },
        filename:(req, file, done)=>{
            var fileName=Date.now() + ".jpg"; // 똑같은 파일을 많이 만들면 오류가 날 수 있으므로 date.now함수를 이용
            done(null, fileName);
        }
    })
});

/* 도서 검색페이지 */
router.get('/', function(req, res, next) {
  res.render('index', {title:'도서검색', pageName:'books/search.ejs'});
});

//도서 검색 결과 저장
router.post('/search/insert', function(req, res) {
  const title=req.body.title;
  const authors=req.body.authors;
  const price=req.body.price;
  const publisher=req.body.publisher;
  const image=req.body.thumbnail;
  const contents=req.body.contents;
  const isbn=req.body.isbn;
  //console.log(title, authors, price, publisher, image, contents);
  const sql1='select * from books where isbn=?';
  db.get().query(sql1, [isbn], function(err, rows){
      if(rows.length >0) {  //이미도서가 등록된 경우
        res.send('1');
      }else{  //도서가 없는 경우
        const sql='insert into books(title, authors, price, publisher, image, contents, isbn) values(?,?,?,?,?,?,?)';
        db.get().query(sql, [title, authors, price, publisher, image, contents, isbn], function(err, rows){
          if(err) console.log('도서저장:', err);
          res.send('0');
        });
      }
  });
});

//도서목록 JSON
router.get('/list.json', function(req, res){
  const page=req.query.page;
  const start=(parseInt(page)-1)*5;
  const key=req.query.key;
  const query=`%${req.query.query}%`;
  const sql=`select * from books where ${key} like ? order by bid desc limit ?,5`;
  db.get().query(sql, [query, start], function(err, rows){
    if(err) console.log('도서목록JSON:' , err);
    res.send(rows);
  });
})

//도서 목록 페이지 이동
router.get('/list',function(req, res){
  res.render('index', {title:'도서목록', pageName:'books/list.ejs'});
});

//데이터 총 갯수 출력 (책 추가한 총 갯수)
router.get('/count', function(req, res){
    const key=req.query.key;
    const query='%' + req.query.query + '%';
    const sql=`select count(*) total from books where ${key} like ?`;
    db.get().query(sql, [query], function(err, rows){
      res.send(rows[0]);
    });
});

//도서 삭제 / db 관련작업은 post 추천?  (데이터를 넘겨줄 때 데이터는 겟은 쿼리에, 포스트는 바디에 들어감)
router.post('/delete', function(req, res){
    const bid=req.body.bid;
    const sql="delete from books where bid=?"
    db.get().query(sql, [bid], function(err){
        if(err) console.log("도서 삭제...", err);
        res.sendStatus(200);
    });
});

//도서 정보 페이지 이동  ? 로 받은 값은 query로 받는다!
router.get('/read', function(req, res){
    const bid=req.query.bid;
    const sql="select *,format(price, 0) fmtprice, date_format(regdate, '%Y-%m-%d') fmtdate from books where bid=?";
    db.get().query(sql, [bid], function(err, rows){
        if(err) console.log('도서정보"....',err);
        res.render('index', {title:'도서정보', pageName:'books/read.ejs', book:rows[0]});
    })
});

//도서 수정페이지이동
router.get('/update', function(req, res){
    const bid=req.query.bid;
    const sql="select *,format(price, 0) fmtprice, date_format(regdate, '%Y-%m-%d') fmtdate from books where bid=?";
    db.get().query(sql, [bid], function(err, rows){
        if(err) console.log('도서정보"....',err);
        res.render('index', {title:'도서 정보 수정', pageName:'books/update.ejs', book:rows[0]});
    })
})

//도서 수정 post로 서밋했을 경우 body에 들어가있다.  // fmtdate는 등록일 변수명. 이고 regdate는 sql문 테이블에 들어갈 열을 말한다.
router.post('/update', function(req, res){
    const bid=req.body.bid;
    const title=req.body.title;
    const price=req.body.price;
    const authors=req.body.authors;
    const publisher=req.body.publisher;
    const contents=req.body.contents;
    const fmtdate=req.body.fmtdate;
    const updatedate=req.body.updatedate;
    //console.log(bid,title,price,authors,publisher,contents);
    const sql='update books set title=?,price=?,authors=?,publisher=?,contents=? ,regdate=?, updatedate=? where bid=?';
    db.get().query(sql,[title,price,authors,publisher,contents, fmtdate, updatedate, bid],function(err){
        if(err) console.log('수정오류..........', err);
        res.redirect('/books/read?bid=' + bid);
    })
});

//이미지 업로드
router.post('/upload', upload.single('file'), function(req, res){
    if(req.file){
        const bid=req.body.bid;
        //console.log("파일 이름:", req.file.filename, bid);
        const image = '/upload/book/' + req.file.filename;
        const sql='update books set image=? where bid=?';
        db.get().query(sql, [image, bid], function(err){
        if(err) console.log('이미지 업로드 오류:', err)
        res.redirect('/books/read?bid=' + bid);
        });
    }
});

//도서 정보 페이지 출력
router.get('/info', function(req, res){
    const bid=req.query.bid;
    const sql='select *, format(price,0) fmtprice,date_format(regdate,"%Y-%m-%d") fmtdate from books where bid=?';
    db.get().query(sql, [bid], function(err, rows){
      res.render('index', {title:'도서정보', pageName:'books/info.ejs', book:rows[0]});
    });
});

//좋아요 추가
router.post('/like/insert', function(req, res){
    const bid=req.body.bid;
    const uid=req.body.uid;
    const sql='insert into favorite(bid, uid) values(?,?)';
    db.get().query(sql, [bid, uid], function(err){
        res.sendStatus(200);
    });
});

//좋아요 체크
router.get('/like/check', function(req, res){
    const uid=req.query.uid;
    const bid=req.query.bid;
    const sql='select count(*) cnt from favorite where bid=? and uid=?';
    db.get().query(sql, [bid, uid], function(err, rows){
        res.send(rows[0].cnt.toString());
    });
});

module.exports = router;
