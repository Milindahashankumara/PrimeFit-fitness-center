const Complaint = require('../models/Complaint');

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res) => {
  try {
    let query = {};

    // Filter by customer email
    if (req.query.customerEmail) {
      query.customerEmail = req.query.customerEmail;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // If user is customer, only show their complaints
    if (req.user.role === 'customer') {
      query.customerEmail = req.user.email;
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && complaint.customerEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this complaint'
      });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (Customer)
exports.createComplaint = async (req, res) => {
  try {
    console.log('📝 Creating new complaint...');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);

    const { subject, category, description, priority } = req.body;

    const complaintData = {
      subject,
      category,
      description,
      priority: priority || 'medium',
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerId: req.user.id,
      status: 'pending'
    };

    console.log('💾 Saving complaint to MongoDB:', JSON.stringify(complaintData, null, 2));

    const complaint = await Complaint.create(complaintData);

    console.log('✅ Complaint saved to MongoDB successfully!');
    console.log('Complaint ID:', complaint._id);
    console.log('Saved complaint:', JSON.stringify(complaint, null, 2));

    res.status(201).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('❌ Error creating complaint:', error.message);
    console.error('Stack:', error.stack);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update complaint (Admin only)
// @route   PUT /api/complaints/:id
// @access  Private (Admin)
exports.updateComplaint = async (req, res) => {
  try {
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Update fields
    const { status, response, priority } = req.body;

    if (status) complaint.status = status;
    if (response) {
      complaint.response = response;
      complaint.responseDate = new Date();
    }
    if (priority) complaint.priority = priority;

    if (status === 'resolved') {
      complaint.resolvedBy = req.user.name;
      complaint.responseDate = new Date();
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin or Owner)
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && complaint.customerEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this complaint'
      });
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
