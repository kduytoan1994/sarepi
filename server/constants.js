module.exports = Object.freeze({
    HOME_STATUS : {
        ACTIVE : 1,
        DEACTIVE : 2
    },
    RESERVATION_STATUS : {
        BOOKING : 1,
        STAYING : 2,
        CANCELED : 3,
        CHECKOUT : 4
    },
    ROOM_STATUS : {
        EMPTY : 1,
        BOOKING : 2,
        STAYING : 3,
        CLOSED : 4,
        CONSTRUCTING: 5
    },
    TRANSACTION_TYPE : {
        ONLINE : 1,
        CASH : 2
    },
    TRANSACTION_STATUS : {
        SUCCESSED : 1,
        PENDING : 2,
        FAILED : 3
    },
    USER_ROLE : {
        ADMIN : 'admin',
        MANAGER : 'manager',
        HOME_MANAGER : 'home_manager',
        STAFF : 'staff'
    },
    USER_TITLE : {
        DIRECTOR : 'director',
        RECECPTIONIST : 'Receptionist',
        MANAGER : 'manager',
        STAFF : 'staff'
    }

})