from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

#con=create_engine(os.environ.get["DATABASE_URL"])
con=create_engine('postgresql://postgres:0x112524x0Yan@localhost:8080/postgres')
from db_models import User, Message

Session=sessionmaker(con)
db=Session()

def newMessage(message, author_key):
    author=db.query(User).filter_by(key=author_key).first()
    msg=Message(text=message, author=author)
    db.add(msg)
    db.commit()
    return msg

def registerUser(name, passwd):
    user=db.query(User).filter_by(name=name).first()
    if user!=None and user.check_passwd(passwd):
        user.set_key()
        db.commit()
        return user

