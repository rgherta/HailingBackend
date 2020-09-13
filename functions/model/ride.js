class Ride {

    constructor(uid, customer, customer_name, pickup
        , hash_pickup, pickup_str, destination, hash_destination
        , destination_str, points, distance, duration, payment
        , created, status, conversation, driver, ride_drivers, search_step){

        this.uid = uid;
        this.customer = customer;
        this.customer_name = customer_name;
        this.pickup = pickup;
        this.hash_pickup = hash_pickup;
        this.pickup_str = pickup_str;
        this.destination = destination;
        this.hash_destination = hash_destination;
        this.destination_str = destination_str;
        this.points = points;
        this.distance = distance;
        this.duration = duration;
        this.payment = payment;
        this.created = created;
        this.status = status;
        this.conversation = conversation;
        this.driver = driver;
        this.ride_drivers = ride_drivers;
        this.search_step = search_step;

    }

    get toJson(){
        return {...this};
    }
}

module.exports = { Ride }