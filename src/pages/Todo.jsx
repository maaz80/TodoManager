import { useEffect, useState, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../supabase-client'
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns'
import { toast } from 'react-toastify'
import { ThemeContext } from '../App'
import { Link } from 'react-router-dom'

const Todo = () => {
  const [tasks, setTasks] = useState([])
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [taskModal, setTaskModal] = useState({ isOpen: false, task: null });
  const [hasMoreTasks, setHasMoreTasks] = useState(true);
  const [openImage, setOpenImage] = useState(false)
  const [createTaskLoading, setCreateTaskLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  const openTaskModal = (task) => {
    setTaskModal({ isOpen: true, task });
  };

  const closeTaskModal = () => {
    setTaskModal({ isOpen: false, task: null });
  };

  // Use theme
  const { theme } = useContext(ThemeContext);

  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({
    mode: 'onChange'
  })

  // Get current logged-in user and fetch name
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id);

        // Fetch user's name
        const storedName = localStorage.getItem('userName');
        if (storedName) {
          setUserName(storedName);
        } else {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('user_id', user.id)
              .single();

            if (userData && userData.name) {
              setUserName(userData.name);
              localStorage.setItem('userName', userData.name);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }
      }
      setLoading(false);
    }
    getUser()
  }, [])

  // Fetch tasks
  const fetchTasks = async () => {
    if (!userId) return;

    setLoading(true);

    const start = (currentPage - 1) * tasksPerPage;
    const end = start + tasksPerPage - 1;

    const { data, error } = await supabase
      .from('todo')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })
      .range(start, end)
    if (error) console.error(error)
    else {
      setTasks(data || [])
      setHasMoreTasks(data.length === tasksPerPage);
    }
    setLoading(false);
  }


  // Image Upload 
  const uploadImage = async (file) => {
    const filePath = `${file.name}-${Date.now()}`
    const { error } = await supabase.storage.from('tasks-images').upload(filePath, file)

    if (error) {
      console.log(error)
      return null
    }
    const { data } = supabase.storage.from('tasks-images').getPublicUrl(filePath)
    return data.publicUrl
  }

  // Add task
  const onSubmit = async (data) => {
    setCreateTaskLoading(true)
    if (!userId) {
      toast.error('Please login first!')
      return;
    }
    let imageUrlHere = null;

    // Handle image upload
    if (data.image && data.image[0]) {
      const file = data.image[0]; // Get the uploaded file
      imageUrlHere = await uploadImage(file);
    }
    const { error } = await supabase.from('todo').insert([
      {
        title: data.title,
        due_date: data.dueDate,
        user_id: userId,
        is_done: false,
        description: data.description,
        image_url: imageUrlHere
      }
    ])

    if (error) {
      toast.error('Failed to add task')
      console.error(error)
    } else {
      toast.success('Task added successfully!')
      setCreateTaskLoading(false)
      setShowForm(false)
      reset()
      fetchTasks()
    }
  }

  // Mark done/undone
  const markDone = async (id, isDone) => {
    const { error } = await supabase
      .from('todo')
      .update({ is_done: !isDone })
      .eq('id', id)

    if (error) console.error(error)
    else {
      fetchTasks()
      toast.success('Task updated!')
    }
  }

  // Delete task
  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('todo')
      .delete()
      .eq('id', id)

    if (error) console.error(error)
    else {
      fetchTasks()
      toast.success('Task deleted!')
    }
  }

  useEffect(() => {
    if (userId) fetchTasks(currentPage)
  }, [userId, currentPage])

  // Handeling page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Filter tasks based on active tab
  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'today':
        return tasks.filter(task => isToday(new Date(task.due_date)))
      case 'upcoming':
        return tasks.filter(task => !isToday(new Date(task.due_date)) && !isPast(new Date(task.due_date)))
      case 'completed':
        return tasks.filter(task => task.is_done)
      case 'overdue':
        return tasks.filter(task => isPast(new Date(task.due_date)) && !task.is_done && !isToday(new Date(task.due_date)))
      default:
        return tasks
    }
  }

  const filteredTasks = getFilteredTasks()

  // Group by date
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const dateKey = format(new Date(task.due_date), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(task)
    return acc
  }, {})

  // Format date for display
  const formatDateHeader = (dateString) => {
    const date = new Date(dateString)
    if (isToday(date)) return '🌟 Today'
    if (isTomorrow(date)) return '🌅 Tomorrow'
    if (isPast(date)) return '⚠️ Overdue - ' + format(date, 'MMM d, yyyy')

    // Check if it's within the next 7 days
    const now = new Date()
    const weekFromNow = addDays(now, 7)
    if (date <= weekFromNow) {
      return '📅 ' + format(date, 'EEEE - MMM d')
    }
    return '🗓️ ' + format(date, 'MMM d, yyyy')
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading your tasks...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-2 lg:p-4">
      {/* Header */}
      <header className={`flex items-center justify-between mb-4 lg:mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{userName || "TaskMaster"}</h1>
          <p className="text-xs md:text-sm opacity-70">Organize your day with style</p>
        </div>

        <div className='-mt-3'>
          <div className="relative">
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={!userId}
              className={`flex items-center px-3 md:px-4 py-1 md:py-2 rounded-full font-medium transition-all 
              ${!userId
                  ? 'bg-gray-300 cursor-not-allowed'
                  : showForm
                    ? (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800')
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl cursor-pointer'}`}
              title={!userId ? "Please login first" : ""}
            >
              {showForm ? 'Cancel' : '+ New Task'}
            </button>
            {!userId && (
              <span className="absolute -bottom-3.5 left-4 text-[10px] text-red-500">Login to add tasks</span>
            )}
          </div>
        </div>
      </header>

      {/* Add Task Form */}
      <div
        className={`overflow-hidden transition-all duration-800 ease-in-out ${showForm ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div
          className={`mb-8 p-6 rounded-lg shadow-lg animate-fadeIn ${theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
        >
          <h2 className="text-xl font-bold mb-4">Create New Task</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Title  */}
            <div>
              <input
                placeholder="Task title"
                className={`w-full p-3 rounded-lg border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-200"
                  }`}
                {...register("title", { required: true, minLength: { value: 3, message: 'Title must be at least 3 characters' }, validate: (value) => value.trim() !== "" || "Title cannot be empty or spaces only" })}

              />
              {errors.title && (
                <span className="text-red-500 text-sm">
                  {errors.title.message}
                </span>
              )}
            </div>

            {/* Description  */}
            <div>
              <input
                placeholder="Task description"
                className={`w-full p-3 rounded-lg border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-200"
                  }`}
                {...register("description", { required: true, minLength: { value: 3, message: 'Description must be at least 3 characters' }, validate: (value) => value.trim() !== "" || "Description cannot be empty or spaces only" })}

              />
              {errors.description && (
                <span className="text-red-500 text-sm">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-end justify-between gap-3 md:gap-4">

              {/* Due Date upload button  */}
              <div className="flex-1 w-full">
                <label
                  className={`block mb-1 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  Due Date
                </label>
                <input
                  type="date"
                  className={`w-full p-3 rounded-lg border cursor-pointer ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200"
                    }`}
                  {...register("dueDate", { required: true })}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onClick={(e) => e.target.showPicker()}
                />
                {errors.dueDate && (
                  <span className="text-red-500 text-sm">
                    Please select a due date
                  </span>
                )}
              </div>

              {/* Image upload button */}
              <div className="flex-1 ">
                <label
                  className={`block mb-1 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className={`w-full p-3 rounded-lg border cursor-pointer ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200"
                    }`}
                  {...register("image")}
                />
                {errors.image && (
                  <span className="text-red-500 text-sm">
                    {errors.image.message || "Please select an image"}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!isValid}
                className={`w-[40%] px-3 py-[15px] md:py-3 text-sm md:text-base rounded-lg text-white font-medium transition-all ${!isValid
                    ? "bg-gray-400 cursor-not-allowed"
                    : createTaskLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                  }`}
              >
                {createTaskLoading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Task Filters */}
      <div className="flex task-filters  mb-8 pb-2 sticky top-16 z-10">
        {['all', 'today', 'upcoming', 'completed', 'overdue'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 mx-1 rounded-full whitespace-nowrap font-medium transition-all
              ${activeTab === tab
                ? (theme === 'dark'
                  ? 'bg-blue-700 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md')
                : (theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm')}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4 md:space-y-8">
        {userId ? (
          Object.entries(groupedTasks).length === 0 ? (
            <div className={`text-center py-16 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-medium mb-2">No tasks yet</h3>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {activeTab !== 'all'
                  ? `You don't have any ${activeTab} tasks`
                  : 'Your task list is empty. Create your first task!'}
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 px-6 py-2 bg-blue-600  text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Task
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupedTasks).map(([date, dateTasks]) => (
              <div key={date} className="animate-fadeIn">
                <h2 className={`font-semibold text-lg mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  {formatDateHeader(date)}
                </h2>
                <div className="space-y-3">
                  {dateTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-4 rounded-lg shadow-sm transition-all cursor-pointer
                     ${task.is_done
                          ? (theme === 'dark' ? 'opacity-60 bg-gray-800' : 'opacity-75 bg-gray-50')
                          : (theme === 'dark' ? 'bg-gray-800' : 'bg-white hover:shadow-md')}
                     border-l-4 ${theme === 'dark' ? 'border-blue-700' : 'border-blue-500'}`}
                      onClick={() => openTaskModal(task)}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer
                       ${task.is_done
                            ? (theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                            : (theme === 'dark' ? 'border-2 border-gray-600' : 'border-2 border-gray-300')}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          markDone(task.id, task.is_done);
                        }}
                      >
                        {task.is_done && '✓'}
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <h3 className={`font-medium truncate ${task.is_done ? 'line-through opacity-70' : ''}`}>
                          {task.title}
                        </h3>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className={`p-2 rounded-full hover:bg-red-100 transition-colors
                       ${theme === 'dark' ? 'text-red-400 hover:text-red-600' : 'text-red-500 hover:text-red-700'}`}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>


              </div>
            ))
          )
        ) : (
          <div className={`text-center p-8 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-medium mb-2">Please Login</h3>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
              You need to login to manage your tasks
            </p>
            <Link to={'/login'} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Login
            </Link>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {userId &&
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={` ${currentPage === 1 ? 'bg-gray-100 text-gray-300' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg text-white'} px-4 py-2  rounded `}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasMoreTasks}
            className={`px-4 py-2 ${hasMoreTasks ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg text-white' : 'bg-gray-100 text-gray-300'}  rounded`}
          >
            Next
          </button>
        </div>
      }


      {/* Task Modal */}
      {taskModal.isOpen && taskModal.task && (
        <div className="fixed inset-0 backdrop-blur-2xl bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-lg shadow-xl p-6 max-h-[80vh] overflow-y-auto
        ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Task Details</h3>
              <button
                onClick={closeTaskModal}
                className="px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className="mb-4">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Due date:</span>
                  <p className="font-medium">{format(new Date(taskModal.task.due_date), 'PPP')}</p>
                </div>

                <div className="mb-4">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Task:</span>
                  <p className="font-medium text-lg mt-1">{taskModal.task.title}</p>
                </div>
              </div>

              {/* Image  */}
              {taskModal.task.image_url && (
                <div className='w-[50%] rounded-md overflow-hidden' onClick={() => setOpenImage(true)}>
                  <img src={taskModal.task.image_url} alt="Uploaded Image" className='w-full max-h-[160px]  rounded-md object-cover' />
                </div>
              )}
            </div>

            <div className='w-[90%]'>
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Description:</span>
              <p className="font-normal md:font-medium text-sm md:text-lg mt-1 break-words whitespace-pre-wrap">{taskModal.task.description}</p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  markDone(taskModal.task.id, taskModal.task.is_done);
                  closeTaskModal();
                }}
                className={`px-4 py-2 rounded-lg font-medium
            ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                Mark as {taskModal.task.is_done ? 'Undone' : 'Done'}
              </button>

              <button
                onClick={() => {
                  deleteTask(taskModal.task.id);
                  closeTaskModal();
                }}
                className={`px-4 py-2 rounded-lg font-medium
            ${theme === 'dark' ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Image Modal */}
      {openImage && taskModal.task.image_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="relative w-[98%] h-full flex items-center justify-center">
            {/* Full-Screen Image */}
            <img
              src={taskModal.task.image_url}
              alt="Uploaded Task"
              className="max-w-full max-h-full object-contain"
            />

            {/* Close Button */}
            <button
              onClick={() => setOpenImage(false)}
              className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1.5 rounded-full hover:bg-gray-700"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Todo