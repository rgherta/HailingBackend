class appUser {

    constructor(category, created, email, fcm_token, uid){
        this.category = category;
        this.created = created;
        this.email = email;
        this.fcm_token = fcm_token;
        this.uid = uid;
    }

    get toJson(){
        return {...this};
    }
}


class appDriver {

    constructor(uid, cur, name, ppk, plate, rating, rides, status, vehicle, payment, city, phone, loc, hash_loc, fcm_token){
        this.uid = uid,
        this.cur = cur,
        this.name = name,
        this.ppk = ppk,
        this.plate = plate,
        this.rating = rating,
        this.rides = rides,
        this.status = status,
        this.vehicle = vehicle,
        this.payment = payment,
        this.city = city,
        this.phone = phone,
        this.loc = loc,
        this.hash_loc = hash_loc,
        this.fcm_token = fcm_token
    }

    get toJson(){
        return {...this};
    }
}



module.exports = { appUser, appDriver };