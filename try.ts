type User = {
    id:number,
    name:string
}
type Course ={
    id:number,
    price:number

}
type Payment =  {
    user: User,
    course:Course,
    price:number
}

interface paymentRepositary {
    save(payment:Payment) : void,
    findAllbycourse(courseId:number):Payment[],
}

class PaymentRepositary implements paymentRepositary {
    private paymentdb: Payment[] = []
     save(payment:Payment):void {
       this.paymentdb.push(payment)
    }
    findAllbycourse(courseId: number): Payment[] {
        const coursepayments = this.paymentdb.filter(payment => payment.course.id == courseId)
        if (coursepayments )
           return coursepayments;
        throw new Error("errorr")

    }
} 

class PaymentService {
    constructor(private repo: paymentRepositary) {}

    createpayment(payment:Payment):void{
        this.repo.save(payment)
    }
}

const repo = new PaymentRepositary();

const service = new PaymentService(repo)

const user1:User = {id:1,name:"omar"}
const course1:Course={id:1,price:200}
const payment1:Payment = {user:user1,course:course1,price:course1.price}

service.createpayment(payment1)