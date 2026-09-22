import { Booking } from '../models/Booking.js';
import Joi from 'joi';

// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  roomNumber: Joi.string().trim().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  purpose: Joi.string().trim().optional(),
  bookedBy: Joi.string().hex().length(24).optional()
});

const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  purpose: Joi.string(),
  bookedBy: Joi.string().hex().length(24)
}).min(1);


// TODO: per README.md section 4, you will need a way to detect whether a
// proposed booking conflicts with an existing one on the same room.
async function hasBookingConflict(roomNumber, startDate, endDate, excludeId) {
  const query = {roomNumber: {$eq: roomNumber}, startDate: { $lt: endDate }, endDate: { $gt: startDate }};
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return Boolean(await Booking.exists(query));
}

// GET /api/bookings
// TODO: implement per README.md section 3.
export async function getAllBookings(req, res, next) {
  try {
    // TODO
    const response = await Booking.find().populate('bookedBy' , 'name email');
    if (!response) {return res.status(400).JSON({message: "Something went wrong"})};
    res.json({booking: response});
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getBooking(req, res, next) {
  try {
    // TODO
    const response = await Booking.findById(req.params.id).populate('bookedBy' , 'name email');;
    if(!response){return res.status(400).json({message: "Booking not found"})};
    res.json({booking : response})
  } catch (err) { next(err); }
}

// POST /api/bookings
// TODO: implement per README.md sections 3 and 4.
export async function createBooking(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const conflict = await hasBookingConflict(value.roomNumber , value.startDate , value.endDate);

    if(conflict){return res.status(409).json({message: "Conflict occured"})}

    const booking = await Booking.create({
      roomNumber: value.roomNumber,
      startDate: value.startDate,
      endDate: value.endDate,
      purpose: value.purpose,
      bookedBy: value.bookedBy
    });
    res.status(201).json({ booking });
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id
export async function updateBooking(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const conflict = await hasBookingConflict(value.roomNumber , value.startDate , value.endDate , value._id);

    if(conflict){return res.status(409).json({message: "Conflict occured"})}

    const booking = await Booking.findByIdAndUpdate(req.params.id, value );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    res.json({ booking });
  } catch (err) { next(err); }
}

// DELETE /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function deleteBooking(req, res, next) {
  try {
    // TODO
      const doc = await Booking.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Booking not found' });
      res.json({ ok: true });
  } catch (err) { next(err); }
}
