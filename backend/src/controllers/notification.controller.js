import Notification from "../models/Notification.js";

// Get all notifications (latest first)
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const countNotifications = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });
    if (count == 0) return res.status(404).json({ message: "Notifications not found!", status: 404 });
    return res.status(200).json({
      message: "Unread notifications count",
      count
    });

  } catch (error) {
    console.error("Count Notification Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// Mark single notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    console.error("Mark Read Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete(id);
    if (!notification) return res.status(404).json({ message: "Notification not found!" });
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};